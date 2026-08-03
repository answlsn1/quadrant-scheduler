/**
 * 사분면 정의 — 단일 진실 공급원(single source of truth).
 *
 * 번호는 표준 아이젠하워 순서다 (2026-08-03 지누 결정으로 재편):
 * 우선순위가 번호 순서대로 내려간다. 중요한 것(2번)이
 * 급하기만 한 것(3번)보다 위에 온다.
 *
 * 역사: v1 초기에는 지누가 배운 프레임(2·3번이 표준과 반대)을 썼다.
 * 다중 사용자 배포로 전제가 바뀌면서 표준 순서로 재편했고,
 * 기존 데이터는 마이그레이션(renumber_quadrants_standard)으로 번호를 맞바꿨다.
 *
 * 이 앱의 승부처는 2번(일정에 넣는다)이다. 항상 밀리는 칸이므로
 * 미배치 2번 개수를 홈 상단에 상시 노출한다.
 */

export const QUADRANTS = [1, 2, 3, 4] as const
export type Quadrant = (typeof QUADRANTS)[number]

export type TaskStatus = 'inbox' | 'active' | 'done' | 'dropped'

export interface QuadrantSpec {
  /** 사분면 번호 */
  id: Quadrant
  /** 중요도 / 긴급도 */
  axis: string
  /** 강제 동사 — 분류로 끝나지 않게 하는 장치 (원칙 2) */
  verb: string
  /** 어떤 것들이 여기 들어가는지 */
  examples: string
  /**
   * 이 칸의 색을 담은 CSS 변수 이름. 값은 globals.css에 있다.
   * 데이터로 결정되는 색이라 Tailwind 클래스 대신 인라인 style로 쓴다
   * (동적 클래스명은 Tailwind가 추출하지 못한다).
   */
  colorVar: string
}

export const QUADRANT_SPEC: Record<Quadrant, QuadrantSpec> = {
  1: {
    id: 1,
    axis: '중요 O / 급함 O',
    verb: '지금 한다',
    examples: '긴급 업무, 마감 임박, 돌발상황',
    colorVar: '--q1',
  },
  2: {
    id: 2,
    axis: '중요 O / 급함 X',
    verb: '일정에 넣는다',
    examples: '말씀·자기계발·건강·장기계획',
    colorVar: '--q2',
  },
  3: {
    id: 3,
    axis: '중요 X / 급함 O',
    verb: '몰아서 처리',
    examples: '상시 보고, 급한 부탁, 즉답 불필요 메시지',
    colorVar: '--q3',
  },
  4: {
    id: 4,
    axis: '중요 X / 급함 X',
    verb: '버린다',
    examples: '의미 없는 유튜브, 습관적 서핑, 뒷담화',
    colorVar: '--q4',
  },
}

/** 사분면 전체 조망의 세로 나열 순서 — 우선순위 그대로 */
export const BOARD_ORDER: readonly Quadrant[] = [1, 2, 3, 4]

/**
 * 분류에서 이 칸을 고르면 날짜 지정 단계를 거친다.
 * "일정에 넣는다"가 강제 동사인 칸이다.
 */
export const SCHEDULE_ON_CLASSIFY: Quadrant = 2

/**
 * 4번은 "버린다"가 강제 동사다.
 * 분류 화면에서 4번을 고르면 active를 거치지 않고 곧바로 dropped 처리한다.
 * (분류만 하고 멈추는 흐름을 만들지 않는다 — 원칙 2)
 */
export const DROP_ON_CLASSIFY: Quadrant = 4

export function isQuadrant(value: number | null | undefined): value is Quadrant {
  return value === 1 || value === 2 || value === 3 || value === 4
}

/**
 * `var(--q2)` 형태로 바로 쓸 수 있게.
 * DB에서 오는 quadrant는 smallint라 number로 넘어오므로 넓게 받고 안에서 좁힌다.
 */
export function quadrantColor(quadrant: number | null | undefined): string {
  return isQuadrant(quadrant) ? `var(${QUADRANT_SPEC[quadrant].colorVar})` : 'var(--border)'
}
