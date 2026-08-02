'use client'

import { useEffect, useState } from 'react'

/**
 * beforeinstallprompt는 표준 lib.dom에 없는 크롬 계열 전용 이벤트다.
 * 필요한 두 멤버만 좁혀서 선언한다.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * 설치 안내. PWA라 스토어 다운로드가 아니라 "홈 화면에 추가"다.
 *
 * Android·데스크탑 크롬은 beforeinstallprompt를 잡아두면 버튼 한 번으로
 * 설치 다이얼로그를 띄울 수 있다. iOS Safari는 그 이벤트가 없어서
 * 공유 → 홈 화면에 추가를 손으로 안내하는 수밖에 없다.
 */
export function InstallView() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 이미 설치된 창(standalone)에서 열렸으면 안내가 무의미하다
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    function onPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstallEvent(null)
  }

  return (
    <main className="app-shell mx-auto flex w-full max-w-md flex-col overflow-y-auto px-6 pb-10 pt-10">
      <div className="flex items-center gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 아이콘 하나에 최적화 파이프라인이 필요 없다 */}
        <img src="/icons/icon-192.png" alt="" width={56} height={56} className="rounded-xl" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">사분면 스케줄러</h1>
          <p className="mt-0.5 text-sm text-muted">캡처 → 분류 → 실행</p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        앱스토어 없이 설치하는 앱이다. 아래대로 하면 홈 화면에 아이콘이 생기고,
        일반 앱처럼 전체화면으로 뜬다. 구글 계정으로 로그인하면 바로 자기만의
        보드가 만들어진다.
      </p>

      {installed ? (
        <p className="mt-8 rounded-xl border border-[color-mix(in_srgb,var(--q3)_40%,transparent)] bg-[color-mix(in_srgb,var(--q3)_10%,transparent)] px-4 py-3.5 text-sm text-[var(--q3)]">
          이미 설치돼 있다. 홈 화면에서 열면 된다.
        </p>
      ) : installEvent ? (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-8 min-h-[52px] rounded-xl bg-foreground px-4 font-medium text-background"
        >
          지금 설치
        </button>
      ) : null}

      <div className="mt-8 flex flex-col gap-6">
        <Section
          title="iPhone · iPad"
          steps={[
            'Safari로 이 페이지를 연다 (카카오톡 안에서 열렸다면 우하단 메뉴 → Safari로 열기)',
            '하단 가운데 공유 버튼(⬆︎)을 누른다',
            '아래로 내려 "홈 화면에 추가"를 누른다',
          ]}
        />
        <Section
          title="Android"
          steps={[
            'Chrome으로 이 페이지를 연다',
            '위에 "지금 설치" 버튼이 보이면 그걸 누르면 끝',
            '안 보이면 우상단 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"',
          ]}
        />
        <Section
          title="PC (Chrome · Edge)"
          steps={['주소창 오른쪽 끝의 설치 아이콘(⊕ 모양)을 누른다']}
        />
      </div>

      <a
        href="/"
        className="mt-10 text-center text-sm text-muted underline"
      >
        이미 설치했다면 열기 →
      </a>
    </main>
  )
}

function Section({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ol className="mt-2.5 flex list-none flex-col gap-2 text-sm leading-relaxed text-muted">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="shrink-0 tabular-nums text-[var(--q3)]">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
