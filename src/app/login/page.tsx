import { LoginForm } from './login-form'

export const metadata = {
  title: '로그인 · 사분면',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium">사분면</h1>
        <p className="mt-1 text-sm text-muted">캡처 → 분류 → 실행</p>
        <LoginForm next={safeNext(next)} />
      </div>
    </main>
  )
}

/**
 * 로그인 후 돌아갈 경로. 외부 주소로 튕기는 오픈 리다이렉트를 막기 위해
 * 같은 출처의 절대 경로만 통과시킨다.
 */
function safeNext(next: string | undefined): string {
  if (!next) return '/'
  if (!next.startsWith('/')) return '/'
  if (next.startsWith('//')) return '/'
  return next
}
