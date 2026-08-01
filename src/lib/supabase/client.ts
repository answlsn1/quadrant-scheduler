import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 캡처 저장은 이 클라이언트로 브라우저 → Supabase 직접 호출한다.
 * Next 서버 액션을 경유하지 않는 이유는 5초 룰이다 —
 * Vercel 서버리스 콜드스타트가 저장 지연에 끼어들지 않게 한다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
