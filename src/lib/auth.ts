/**
 * 로그인 허용 계정.
 *
 * 이 앱은 1인용 자가도구라 회원가입이 없다. 그런데 구글 로그인은 그 자체로
 * "아무 구글 계정이나 들어올 수 있는 문"이다. 그대로 두면 각자 자기 사분면
 * 보드를 갖게 되고, 그건 작업지시서 5장이 스코프 아웃한 "다중 사용자"다.
 *
 * 그래서 2중으로 막는다:
 *  1. /auth/callback — 허용 목록에 없으면 즉시 signOut 후 되돌려보낸다 (사용자에게 보이는 차단)
 *  2. RLS 정책 — tasks 접근 자체가 이메일 클레임과 대조된다 (실제 방어선)
 *
 * 1번만으로는 부족하다. PKCE 흐름을 직접 몰아서 code를 가로챈 쪽이
 * 스스로 세션을 만들 여지가 있기 때문에, DB에서 한 번 더 막아야 한다.
 *
 * 여기를 고치면 `supabase/migrations`의 allowlist 함수도 같이 고쳐야 한다.
 */
const ALLOWED_EMAILS: readonly string[] = ['answlsn1@gmail.com']

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}

/**
 * 로그인 후 돌아갈 경로.
 * 외부 주소로 튕기는 오픈 리다이렉트를 막기 위해 같은 출처의 절대 경로만 통과시킨다.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return '/'
  if (!next.startsWith('/')) return '/'
  if (next.startsWith('//')) return '/'
  return next
}
