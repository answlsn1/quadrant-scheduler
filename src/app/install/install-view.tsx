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

type Platform = 'ios' | 'android' | 'pc'

const SECTIONS: { key: Platform; title: string; steps: string[] }[] = [
  {
    key: 'ios',
    title: 'iPhone · iPad',
    steps: [
      'Safari로 이 페이지를 연다 (카카오톡 안에서 열렸다면 우하단 메뉴 → Safari로 열기)',
      '하단 가운데 공유 버튼(⬆︎)을 누른다',
      '아래로 내려 "홈 화면에 추가"를 누른다',
    ],
  },
  {
    key: 'android',
    title: 'Android',
    steps: [
      'Chrome으로 이 페이지를 연다',
      '위에 "지금 설치" 버튼이 보이면 그걸 누르면 끝',
      '안 보이면 우상단 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"',
    ],
  },
  {
    key: 'pc',
    title: 'PC (Chrome · Edge)',
    steps: ['주소창 오른쪽 끝의 설치 아이콘(⊕ 모양)을 누른다'],
  },
]

/**
 * 설치 안내. PWA라 스토어 다운로드가 아니라 "홈 화면에 추가"가 설치다.
 *
 * 원클릭 설치는 웹 플랫폼이 금지한다 — 사이트가 스스로 앱을 심을 수 있으면
 * 악성 앱 통로가 되기 때문에 설치는 반드시 사용자 제스처를 거쳐야 한다.
 * Android·PC 크롬은 beforeinstallprompt를 잡아 버튼 1탭이 최소치고,
 * iOS Safari는 설치 API 자체가 없어 수동 안내가 유일하다.
 *
 * 그래서 할 수 있는 것을 한다: 접속 기기를 감지해 그 기기용 안내를 맨 위로.
 */
export function InstallView() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState<Platform | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios')
    } else if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
      // iPadOS는 기본이 "데스크탑 사이트"라 Mac인 척한다. 터치 지점 수로 가른다.
      setPlatform('ios')
    } else if (/Android/.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('pc')
    }

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

  // 접속한 기기의 안내가 맨 위로 온다. 감지 전(SSR·첫 렌더)에는 기본 순서.
  const ordered = platform
    ? [
        ...SECTIONS.filter((s) => s.key === platform),
        ...SECTIONS.filter((s) => s.key !== platform),
      ]
    : SECTIONS

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
        <p className="mt-8 rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-3.5 text-sm text-[var(--accent)]">
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
        {ordered.map((section) => (
          <Section
            key={section.key}
            title={section.title}
            steps={section.steps}
            highlight={section.key === platform}
          />
        ))}
      </div>

      <a href="/" className="mt-10 text-center text-sm text-muted underline">
        이미 설치했다면 열기 →
      </a>
    </main>
  )
}

function Section({
  title,
  steps,
  highlight,
}: {
  title: string
  steps: string[]
  highlight: boolean
}) {
  return (
    <section
      className={`rounded-xl border p-4 ${
        highlight ? 'border-[color-mix(in_srgb,var(--accent)_45%,transparent)]' : 'border-border'
      }`}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {title}
        {highlight ? (
          <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
            지금 이 기기
          </span>
        ) : null}
      </h2>
      <ol className="mt-2.5 flex list-none flex-col gap-2 text-sm leading-relaxed text-muted">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="shrink-0 tabular-nums text-[var(--accent)]">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
