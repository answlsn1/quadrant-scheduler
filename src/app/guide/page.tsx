import Link from 'next/link'

import { BOARD_ORDER, QUADRANT_SPEC } from '@/lib/quadrant'

export const metadata = {
  title: '사용법',
  description: 'Q-Do가 무엇이고 어떻게 쓰는지',
}

/**
 * 앱 설명 (사장님 요청 2026-08-02 — 지인 배포라 처음 받은 사람이 정확히 모를 수 있다).
 * 로그인 없이 열린다 — 설치 안내처럼 링크로 공유될 수 있는 페이지다.
 * 사분면 정의는 QUADRANT_SPEC에서 가져온다. 여기 따로 적으면 두 곳이 어긋난다.
 */
export default function GuidePage() {
  return (
    <main className="app-shell mx-auto flex w-full max-w-md flex-col overflow-y-auto px-6 pb-10 pt-10">
      <h1 className="text-xl font-semibold tracking-tight">이 앱은 뭐 하는 앱인가</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        머릿속에 담아두면 일이 아니라 <b className="text-foreground">걱정</b>이 된다.
        이 앱은 그걸 꺼내서 네 칸 중 하나로 나누고, 나눈 대로{' '}
        <b className="text-foreground">실행</b>까지 끌고 가는 도구다.
        분류하고 뿌듯해하는 앱이 아니다 — 칸마다 해야 할 동작이 정해져 있다.
      </p>

      <h2 className="mt-8 text-sm font-semibold">네 칸과 각 칸의 동작</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BOARD_ORDER.map((q) => {
          const spec = QUADRANT_SPEC[q]
          return (
            <div
              key={q}
              className="rounded-xl border border-border p-3"
              style={{ borderLeftWidth: 3, borderLeftColor: `var(${spec.colorVar})` }}
            >
              <p className="text-[11px] text-muted">
                {spec.id} · {spec.axis}
              </p>
              <p className="mt-1 text-sm font-semibold">{spec.verb}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{spec.examples}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted">
        2번이 핵심이다. 중요한데 급하지 않은 것은 항상 밀린다 — 그래서 이 앱은
        2번에 날짜를 정하라고 계속 조른다. 4번은 죄책감 없이 버리라고 있는 칸이다.
        버린 기록도 남는다.
      </p>

      <h2 className="mt-8 text-sm font-semibold">쓰는 순서</h2>
      <ol className="mt-3 flex list-none flex-col gap-2.5 text-sm leading-relaxed text-muted">
        <Step n={1} title="적는다">
          첫 화면 아래 입력창에 떠오르는 것을 그냥 적는다. 잘 쓰려고 하지 않는다 —
          꺼내는 게 목적이다.
        </Step>
        <Step n={2} title="나눈다">
          적자마자 네 칸 중 하나로 나눈다. 1번은 실행 시간을, 2번은 날짜를 물어본다.
          바쁘면 <b className="text-foreground">나중에</b>를 눌러 넘기고, 쌓인 것은
          화면 위 <b className="text-foreground">인박스</b> 버튼으로 몰아서 나눈다.
        </Step>
        <Step n={3} title="실행한다">
          첫 화면에 오늘 할 것이 올라온다. 항목을 탭하면 완료·버리기가 나온다.
        </Step>
      </ol>

      <h2 className="mt-8 text-sm font-semibold">화면 두 개</h2>
      <ul className="mt-3 flex list-none flex-col gap-2 text-sm leading-relaxed text-muted">
        <li><b className="text-foreground">오늘의 일정</b> — 적고, 나누고, 실행하는 곳. 오늘·내일 할 것과 네 칸 전체가 다 여기 있다</li>
        <li><b className="text-foreground">기록</b> — 완료한 것과 버린 것. 잘못 넘어왔으면 되돌리기</li>
      </ul>

      <h2 className="mt-8 text-sm font-semibold">자주 묻는 것</h2>
      <dl className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
        <div>
          <dt className="font-medium">내가 적은 걸 다른 사람이 보나?</dt>
          <dd className="mt-0.5 text-muted">
            아니다. 계정마다 완전히 분리돼 있고, 서로의 항목은 서버 차원에서 접근이 막혀 있다.
          </dd>
        </div>
        <div>
          <dt className="font-medium">폰이랑 컴퓨터랑 같이 쓸 수 있나?</dt>
          <dd className="mt-0.5 text-muted">
            같은 구글 계정으로 로그인하면 어디서든 같은 목록이 뜬다.
          </dd>
        </div>
        <div>
          <dt className="font-medium">회원가입은?</dt>
          <dd className="mt-0.5 text-muted">없다. 구글로 처음 로그인하는 순간이 가입이다.</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-2.5">
        <Link
          href="/"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-foreground font-medium text-background"
        >
          시작하기
        </Link>
        <Link
          href="/install"
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-border text-sm text-muted"
        >
          폰에 앱으로 설치하기
        </Link>
      </div>
    </main>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 tabular-nums text-[var(--accent)]">{n}</span>
      <span>
        <b className="text-foreground">{title}.</b> {children}
      </span>
    </li>
  )
}
