import { NextResponse, type NextRequest } from 'next/server'

import { safeNext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * 구글 OAuth 콜백. Supabase가 발급한 PKCE code를 세션으로 교환한다.
 *
 * 다중 사용자 전환(2026-08-02) 이후 allowlist 차단은 없다.
 * 처음 로그인하는 구글 계정은 이 교환 과정에서 자동으로 계정이 만들어진다 —
 * 별도의 회원가입 화면이 필요 없는 이유다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  // 구글 동의 화면에서 취소했거나 provider 설정이 잘못된 경우
  if (searchParams.get('error')) {
    return redirectTo(request, '/login?error=oauth')
  }

  if (!code) {
    return redirectTo(request, '/login?error=nocode')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectTo(request, '/login?error=exchange')
  }

  return redirectTo(request, next)
}

/**
 * Vercel 뒤에서는 request.nextUrl.origin이 내부 호스트일 수 있다.
 * 프록시가 붙여주는 x-forwarded-host를 우선 사용해 실제 도메인으로 되돌려보낸다.
 */
function redirectTo(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'

  const base =
    !isLocal && forwardedHost
      ? `https://${forwardedHost}`
      : request.nextUrl.origin

  return NextResponse.redirect(new URL(path, base))
}
