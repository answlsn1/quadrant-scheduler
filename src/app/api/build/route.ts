/**
 * 현재 서버가 물고 있는 배포 식별자를 알려준다.
 *
 * 백그라운드에 떠 있던 앱은 자기 번들에 인라인된 옛 식별자를 들고 있다.
 * 포그라운드로 돌아올 때 이걸 호출해 값이 다르면 조용히 새로고침한다.
 * (알림·배너 없음 — 사장님이 판단할 게 없는 결정이라 물어볼 이유가 없다)
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    { id: process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
