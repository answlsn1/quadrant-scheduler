import { safeNext } from '@/lib/auth'

import { LoginForm } from './login-form'

export const metadata = {
  title: '로그인 · 사분면',
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
        <h1 className="text-xl font-medium">사분면</h1>
        <p className="mt-1 text-sm text-muted">캡처 → 분류 → 실행</p>

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
