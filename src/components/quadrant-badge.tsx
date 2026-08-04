import { QUADRANT_SPEC, quadrantColor, type Quadrant } from '@/lib/quadrant'

/**
 * 사분면 번호를 그 칸의 색 블록에 담아 보여준다 (2026-08-04 시안 확정).
 *
 * 이전에는 7px 점 하나였다 — 색이 정보인 앱인데 색이 거의 안 읽혔다.
 * 번호를 색에 넣으면 목록의 주인이 누구인지 글씨를 읽기 전에 알 수 있다.
 *
 * `solid`는 채운 형태(개수 뱃지처럼 시선을 끌어야 할 때),
 * 기본은 옅게 깐 형태(제목 옆에서 조용히 자리만 알릴 때).
 */
export function QuadrantBadge({
  quadrant,
  solid = false,
  className = '',
}: {
  quadrant: Quadrant
  solid?: boolean
  className?: string
}) {
  const color = quadrantColor(quadrant)

  return (
    <span
      aria-hidden="true"
      style={
        solid
          ? { background: color, color: 'var(--background)' }
          : { background: `color-mix(in srgb, ${color} 18%, transparent)`, color }
      }
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11.5px] font-bold tabular-nums ${className}`}
    >
      {QUADRANT_SPEC[quadrant].id}
    </span>
  )
}
