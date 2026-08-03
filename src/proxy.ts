import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/database'

/**
 * Next 16부터 `middleware.ts`는 deprecated이고 `proxy.ts`가 그 자리를 대신한다.
 * (nextjs.org/docs/messages/middleware-to-proxy)
 *
 * 하는 일 두 가지:
 *  1. Supabase 세션 토큰 갱신 → 응답 쿠키에 다시 써준다
 *  2. 인증 가드 — 비로그인은 /login으로, 로그인 상태로 /login 접근은 홈으로
 */

/**
 * 로그인 없이 접근 가능한 경로.
 * /auth/callback은 아직 세션이 없는 상태로 들어오므로 반드시 열어둬야 한다.
 * 막으면 구글에서 돌아온 code가 교환되기도 전에 /login으로 튕긴다.
 */
const PUBLIC_PATHS = [
  '/login',
  '/auth',
  // 배포 식별자만 돌려준다. 인증에 걸리면 세션 만료 시 JSON 대신 로그인 HTML이
  // 돌아와 갱신 확인이 조용히 망가진다.
  '/api/build',
  // 설치 안내·사용법 — 지인들에게 공유하는 링크라 로그인 없이 열려야 한다
  '/install',
  '/guide',
]

/**
 * 이미 로그인한 상태로 들어오면 홈으로 보낼 경로.
 * /auth/callback은 여기 넣지 않는다 — 넣으면 재로그인 시 code가 교환되기 전에 튕겨나간다.
 */
const SIGNED_IN_REDIRECT_PATHS = ['/login']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          // 인증 쿠키가 실린 응답이 CDN에 캐시되면 남의 세션이 나에게 올 수 있다.
          // 라이브러리가 넘겨주는 no-store 계열 헤더를 그대로 반영한다.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        },
      },
    },
  )

  // 응답이 확정되기 전에 호출해야 갱신된 토큰이 쿠키로 나간다.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  const { pathname } = request.nextUrl
  const matches = (paths: string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (!signedIn && !matches(PUBLIC_PATHS)) {
    return redirectKeepingCookies(request, response, '/login', pathname)
  }

  if (signedIn && matches(SIGNED_IN_REDIRECT_PATHS)) {
    return redirectKeepingCookies(request, response, '/')
  }

  return response
}

/**
 * 리다이렉트하면서도 방금 갱신된 세션 쿠키를 잃지 않게 옮겨 담는다.
 * 이걸 빼먹으면 토큰 갱신이 매 요청 반복되면서 랜덤 로그아웃이 난다.
 */
function redirectKeepingCookies(
  request: NextRequest,
  source: NextResponse,
  pathname: string,
  next?: string,
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  if (next && next !== '/') {
    url.searchParams.set('next', next)
  }

  const redirect = NextResponse.redirect(url)
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie)
  }
  return redirect
}

export const config = {
  matcher: [
    /*
     * 정적 자산과 PWA 매니페스트는 제외한다.
     * matcher 없이 두면 CSS·JS·아이콘까지 인증 가드에 걸려 앱이 통째로 안 뜬다.
     * manifest.webmanifest는 비로그인 상태에서도 읽혀야 홈스크린 설치가 된다.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
}
