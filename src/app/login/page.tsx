import { safeNext } from '@/lib/auth'
import { BOARD_ORDER, QUADRANT_SPEC } from '@/lib/quadrant'

import { LoginForm } from './login-form'

export const metadata = {
  title: '로그인',
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth: '구글 로그인이 취소됐거나 실패했습니다.',
  nocode: '인증 코드가 오지 않았습니다. 다시 시도해 주세요.',
  exchange: '세션을 만들지 못했습니다. 다시 시도해 주세요.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const message = error ? (ERROR_MESSAGES[error] ?? '로그인에 실패했습니다.') : null

  /*
   * 세로는 스크롤을 허용하고 가로만 잘라낸다 — 배경 광이 화면보다 넓어
   * 가로 스크롤이 생기는 것만 막고, 화면이 작거나 시스템 글씨가 큰 기기에서
   * 내용이 잘리지는 않게 한다. 가운데 정렬은 자식의 m-auto가 맡는다
   * (flex의 items-center는 넘칠 때 위쪽을 잘라먹는다).
   */
  return (
    <main className="app-shell relative flex flex-col overflow-y-auto overflow-x-hidden px-6 py-10">
      {/*
        마크 뒤에서 은은하게 도는 빛. 다크 화면이 평평해 보이지 않게 깊이를 준다.
        장식이 아니라 시선을 마크로 모으는 장치다.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[34%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 opacity-[0.13]"
        style={{
          background: 'radial-gradient(circle, var(--accent), transparent 68%)',
        }}
      />

      <div className="relative m-auto w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <QuadrantMark />

          {/*
            워드마크. 짧은 영문 두 음절이라 기본 자간이면 헐거워 보인다 —
            자간을 조여 하나의 덩어리로 읽히게 하고, 다크 배경에서
            또렷하되 무겁지 않게 semibold로 잡았다.
          */}
          <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.045em]">Q-Do</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            중요한 일에 먼저 집중하는
            <br />
            4분면 스케줄러
          </p>
        </div>

        {message ? (
          <p
            role="alert"
            className="mt-7 rounded-xl border border-[color-mix(in_srgb,var(--q1)_40%,transparent)] bg-[color-mix(in_srgb,var(--q1)_10%,transparent)] px-3.5 py-3 text-sm text-[var(--q1)]"
          >
            {message}
          </p>
        ) : null}

        <LoginForm next={safeNext(next)} />

        {/*
          네 칸을 여기서 한 번 보여준다. 지인 배포라 처음 받은 사람이
          "무슨 앱인지" 모르고 로그인 버튼을 마주하는 일이 없게.
        */}
        <div className="mt-9 border-t border-border pt-6">
          <p className="text-center text-[11px] tracking-[0.06em] text-muted">
            할 일을 네 칸으로 나눈다
          </p>
          <ul className="mt-3.5 grid grid-cols-2 gap-2">
            {BOARD_ORDER.map((q) => {
              const spec = QUADRANT_SPEC[q]
              return (
                <li
                  key={q}
                  style={{ borderLeftColor: `var(${spec.colorVar})` }}
                  className="card-raise rounded-lg border-l-[3px] px-3 py-2.5"
                >
                  <p className="text-[10px] text-muted">{spec.axis}</p>
                  <p
                    className="mt-0.5 text-[13px] font-semibold"
                    style={{ color: q === 4 ? 'var(--muted)' : `var(${spec.colorVar})` }}
                  >
                    {spec.verb}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>

        <p className="mt-7 text-center text-xs leading-relaxed text-muted">
          처음이어도 구글로 로그인하면 바로 계정이 만들어진다.
          <br />
          폰에 앱으로 설치하려면{' '}
          <a href="/install" className="text-[var(--accent)] underline">
            설치 안내
          </a>
          .
        </p>
      </div>
    </main>
  )
}

/**
 * 브랜드 마크 = 제품 개념. 앱 아이콘과 같은 2×2 격자를 사분면 색으로 그린다.
 * 로고를 보는 것만으로 "네 칸으로 나누는 앱"이 전달되도록 색을 실제 팔레트에서 가져온다.
 */
function QuadrantMark() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <rect x="2" y="2" width="26" height="26" rx="7" fill="var(--q1)" />
      <rect x="32" y="2" width="26" height="26" rx="7" fill="var(--q2)" />
      <rect x="2" y="32" width="26" height="26" rx="7" fill="var(--q3)" />
      <rect
        x="34"
        y="34"
        width="22"
        height="22"
        rx="6"
        fill="none"
        stroke="var(--q4)"
        strokeWidth="3"
      />
    </svg>
  )
}
