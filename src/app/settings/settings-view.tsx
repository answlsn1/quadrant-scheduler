'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { isIOS, isStandalone, pushSupported, vapidKeyBytes } from '@/lib/push'
import { createClient } from '@/lib/supabase/client'

/**
 * 다음 발송 시각 안내. 발송 함수와 같은 규칙(KST, 하루 1회)으로 계산한다.
 * KST는 DST가 없어 UTC+9 고정 오프셋이 안전하다.
 */
function nextSendLabel(time: string, enabled: boolean): string {
  if (!enabled) return '알림이 꺼져 있다.'
  const kst = new Date(Date.now() + 9 * 3600_000)
  const [h, m] = time.split(':').map(Number)
  const nowMinutes = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  const when = h * 60 + m > nowMinutes ? '오늘' : '내일'
  return `다음 알림: ${when} ${time}`
}

type DeviceState =
  | 'unsupported' // 이 브라우저는 웹푸시가 안 된다
  | 'ios-not-installed' // iOS인데 홈 화면 설치 전 — 애플 제약
  | 'denied' // 권한을 거부해 둔 상태
  | 'off' // 지원되고 권한도 열려 있는데 구독이 없다
  | 'on' // 이 기기로 알림이 온다

/**
 * 알림 설정 (2026-08-03 승인 — "매일 지정 시간에 당일 일정 알림").
 *
 * 두 층으로 나뉜다:
 *  - 계정: 알림 시간·켬/끔 (notification_settings, 모든 기기 공통)
 *  - 기기: 이 브라우저/폰의 푸시 구독 (push_subscriptions, 기기마다 따로 켠다)
 */
export function SettingsView() {
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState<string | null>(null)
  const [notifyTime, setNotifyTime] = useState('08:00')
  const [enabled, setEnabled] = useState(true)
  const [device, setDevice] = useState<DeviceState>('unsupported')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getClaims()
      const sub = data?.claims?.sub
      if (typeof sub !== 'string') return
      setUserId(sub)

      const { data: settings } = await supabase
        .from('notification_settings')
        .select('notify_time, enabled')
        .maybeSingle()

      if (settings) {
        setNotifyTime(String(settings.notify_time).slice(0, 5))
        setEnabled(settings.enabled)
      }

      await refreshDeviceState()
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회
  }, [])

  async function refreshDeviceState() {
    if (!pushSupported()) {
      setDevice(isIOS() && !isStandalone() ? 'ios-not-installed' : 'unsupported')
      return
    }
    if (isIOS() && !isStandalone()) {
      setDevice('ios-not-installed')
      return
    }
    if (Notification.permission === 'denied') {
      setDevice('denied')
      return
    }
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    setDevice(subscription ? 'on' : 'off')
  }

  /** 계정 설정 저장. 행이 없으면 만든다. */
  async function saveAccount(next: { notify_time?: string; enabled?: boolean }) {
    if (!userId) return
    const { error } = await supabase.from('notification_settings').upsert(
      {
        user_id: userId,
        notify_time: next.notify_time ?? notifyTime,
        enabled: next.enabled ?? enabled,
      },
      { onConflict: 'user_id' },
    )
    setMessage(error ? '저장하지 못했습니다.' : '저장됐다.')
  }

  async function enableThisDevice() {
    if (busy) return
    setBusy(true)
    setMessage(null)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setDevice(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyBytes() as BufferSource,
        }))

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setMessage('구독 정보를 읽지 못했습니다. 다시 시도해라.')
        return
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
        { onConflict: 'endpoint' },
      )
      if (error) {
        setMessage('구독을 저장하지 못했습니다.')
        return
      }

      // 기기를 켰다는 건 알림을 원한다는 뜻 — 계정 설정도 같이 켠다
      await saveAccount({ enabled: true })
      setEnabled(true)
      setDevice('on')
      setMessage('이 기기로 알림이 온다.')
    } finally {
      setBusy(false)
    }
  }

  async function disableThisDevice() {
    if (busy) return
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
        await subscription.unsubscribe()
      }
      setDevice('off')
      setMessage('이 기기의 알림을 껐다.')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('오늘의 일정 (테스트)', {
      body: '알림이 이렇게 온다. 매일 ' + notifyTime + '에 당일 일정을 보내준다.',
      icon: '/icons/icon-192.png',
      tag: 'test',
    })
  }

  return (
    <main className="app-shell mx-auto flex w-full max-w-md flex-col overflow-y-auto px-5 pb-10 pt-6">
      <Link href="/" className="text-xs text-muted underline">
        ← 오늘의 일정
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">알림 설정</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        매일 정한 시간에 그날의 일정을 알림 하나로 보내준다. 그 외의 알림은 없다.
      </p>

      {/* 계정 공통 설정 */}
      <section className="mt-7 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">알림 시간</h2>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="time"
            value={notifyTime}
            onChange={(e) => setNotifyTime(e.target.value)}
            aria-label="알림 시간"
            className="min-h-[48px] flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void saveAccount({ notify_time: notifyTime })}
            className="min-h-[48px] rounded-lg border border-border px-4 text-sm"
          >
            저장
          </button>
        </div>

        <label className="mt-4 flex min-h-[44px] items-center justify-between text-sm">
          알림 받기
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked)
              void saveAccount({ enabled: e.target.checked })
            }}
            className="h-5 w-5 accent-[var(--accent)]"
          />
        </label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          모든 기기에 함께 적용된다. 시간은 한국 시간 기준.
        </p>
        {/* "안 온 건지, 아직 시간이 안 된 건지"를 구분해주는 한 줄 */}
        <p className="mt-2 text-[13px] text-[var(--accent)]">{nextSendLabel(notifyTime, enabled)}</p>
      </section>

      {/* 이 기기 */}
      <section className="mt-4 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">이 기기</h2>

        {device === 'unsupported' ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            이 브라우저는 웹 알림을 지원하지 않는다.
          </p>
        ) : device === 'ios-not-installed' ? (
          <div className="mt-2">
            <p className="text-sm leading-relaxed text-warn">
              iPhone은 홈 화면에 설치된 앱에서만 알림이 온다. 먼저 설치하고, 설치된
              앱을 열어 여기서 켜라.
            </p>
            <Link href="/install" className="mt-2 inline-block text-sm text-[var(--accent)] underline">
              설치 방법 보기
            </Link>
          </div>
        ) : device === 'denied' ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            알림 권한이 거부돼 있다. 브라우저(또는 iOS 설정 → 알림)에서 이 앱의
            알림을 허용한 뒤 다시 켜라.
          </p>
        ) : device === 'on' ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-[var(--accent)]">이 기기로 알림이 온다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void sendTest()}
                className="min-h-[48px] flex-1 rounded-lg border border-border text-sm"
              >
                테스트 알림
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void disableThisDevice()}
                className="min-h-[48px] flex-1 rounded-lg border border-border text-sm text-muted disabled:opacity-50"
              >
                이 기기 끄기
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enableThisDevice()}
            className="mt-3 min-h-[52px] w-full rounded-xl bg-foreground font-medium text-background disabled:opacity-50"
          >
            {busy ? '켜는 중' : '이 기기에서 알림 켜기'}
          </button>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          기기마다 따로 켠다. 폰과 컴퓨터 둘 다 받고 싶으면 각각에서 켜면 된다.
        </p>
      </section>

      {message ? (
        <p role="status" className="mt-4 text-sm text-muted">
          {message}
        </p>
      ) : null}
    </main>
  )
}
