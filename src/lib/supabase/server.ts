import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database'

/**
 * 서버(Server Component / Route Handler)용 Supabase 클라이언트.
 * 요청마다 새로 만든다 — 절대 모듈 스코프에서 공유하지 않는다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 담당하므로 무시해도 안전하다.
          }
        },
      },
    },
  )
}
