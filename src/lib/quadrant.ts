/**
 * 사분면 정의 — 단일 진실 공급원(single source of truth).
 *
 * ⚠️ 경고: 이 번호 체계는 지누가 배운 프레임 그대로다.
 *    표준 아이젠하워 매트릭스와 2번·3번이 **반대**이며, 이는 의도된 것이다.
 *    "일반적인 매트릭스와 다르다"는 이유로 절대 교정하지 말 것.
 *    (작업지시서 0장 원칙 3)
 *
 * 이 앱의 승부처는 3번이다. 항상 밀리는 칸이므로 미배치 3번 개수를
 * 홈 상단에 상시 노출한다.
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
  /** 보드 2×2에서의 자리. 참고 슬라이드와 동일: 좌상 1, 우상 3, 좌하 2, 우하 4 */
  boardCell: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export const QUADRANT_SPEC: Record<Quadrant, QuadrantSpec> = {
  1: {
    id: 1,
    axis: '중요 O / 급함 O',
    verb: '지금 한다',
    examples: '긴급 업무, 마감 임박, 돌발상황',
    boardCell: 'top-left',
  },
  2: {
    id: 2,
    axis: '중요 X / 급함 O',
    verb: '몰아서 처리',
    examples: '상시 보고, 급한 부탁, 즉답 불필요 메시지',
    boardCell: 'bottom-left',
  },
  3: {
    id: 3,
    axis: '중요 O / 급함 X',
    verb: '일정에 박제',
    examples: '말씀·자기계발·건강·장기계획',
    boardCell: 'top-right',
  },
  4: {
    id: 4,
    axis: '중요 X / 급함 X',
    verb: '버린다',
    examples: '의미 없는 유튜브, 습관적 서핑, 뒷담화',
    boardCell: 'bottom-right',
  },
}

/** 보드 2×2 렌더 순서 (좌상 → 우상 → 좌하 → 우하) */
export const BOARD_ORDER: readonly Quadrant[] = [1, 3, 2, 4]

/**
 * 4번은 "버린다"가 강제 동사다.
 * 분류 화면에서 4번을 고르면 active를 거치지 않고 곧바로 dropped 처리한다.
 * (분류만 하고 멈추는 흐름을 만들지 않는다 — 원칙 2)
 */
export const DROP_ON_CLASSIFY: Quadrant = 4

export function isQuadrant(value: number | null | undefined): value is Quadrant {
  return value === 1 || value === 2 || value === 3 || value === 4
}
