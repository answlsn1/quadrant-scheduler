/**
 * 인증 관련 헬퍼.
 *
 * 2026-08-02 다중 사용자 전환: allowlist를 제거했다 (사장님 직접 지시 — 지인·교회 배포).
 * 이제 구글 계정이 있으면 누구나 로그인해 자기만의 보드를 갖는다.
 * 사용자 간 격리는 DB의 RLS(auth.uid() = user_id)가 담당한다.
 */

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
