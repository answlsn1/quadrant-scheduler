import { NextResponse, type NextRequest } from 'next/server'

import { isAllowedEmail, safeNext } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * 구글 OAuth 콜백. Supabase가 발급한 PKCE code를 세션으로 교환한다.
 *
 * Route Handler라서 next/headers의 cookies()에 쓰기가 가능하고,
 * 교환 과정에서 심어진 세션 쿠키가 응답에 함께 실린다.
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
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectTo(request, '/login?error=exchange')
  }

  // 허용 목록 밖의 구글 계정은 여기서 끊는다.
  // 세션 쿠키가 브라우저에 도달하기 전에 같은 요청 안에서 지운다.
  if (!isAllowedEmail(data.user?.email)) {
    await supabase.auth.signOut()
    return redirectTo(request, '/login?error=denied')
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
