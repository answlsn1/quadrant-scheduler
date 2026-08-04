import { safeNext } from '@/lib/auth'

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

  return (
    <main className="app-shell flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/*
          워드마크. 짧은 영문 두 음절이라 기본 자간이면 헐거워 보인다 —
          -0.04em으로 조여서 하나의 덩어리로 읽히게 하고, semibold로
          다크 배경에서 또렷하되 무겁지 않게 잡았다.
        */}
        <h1 className="text-[28px] font-semibold leading-none tracking-[-0.04em]">Q-Do</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          중요한 일에 먼저 집중하는 4분면 스케줄러
        </p>

        {message ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-900/60 px-3 py-2.5 text-sm text-red-400"
          >
            {message}
          </p>
        ) : null}

        <LoginForm next={safeNext(next)} />

        <p className="mt-8 text-xs text-muted">
          처음이어도 구글로 로그인하면 바로 계정이 만들어진다.
          <br />
          폰에 앱으로 설치하려면{' '}
          <a href="/install" className="underline">
            설치 안내
          </a>
          .
        </p>
      </div>
    </main>
  )
}
