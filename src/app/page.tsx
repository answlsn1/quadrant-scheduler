import { createClient } from '@/lib/supabase/server'

/**
 * 홈(오늘) — 1단계에서는 빈 홈이다.
 * 캡처 입력창·인박스 뱃지·미배치 3번 카운터는 2단계에서 붙인다.
 */
export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">오늘</h1>
        <form action="/logout" method="post">
          <button type="submit" className="text-xs text-muted underline">
            로그아웃
          </button>
        </form>
      </header>

      <p className="mt-2 text-xs text-muted">{email}</p>

      <div className="mt-16 border-t border-border pt-6 text-sm text-muted">
        <p>1단계 — 기반만 깔린 상태.</p>
        <p className="mt-1">캡처 입력창과 사분면 분류는 2단계에서 붙는다.</p>
      </div>
    </main>
  )
}
