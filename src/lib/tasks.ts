import type { Database } from '@/types/database'

export type Task = Database['public']['Tables']['tasks']['Row']

/**
 * 오늘 날짜를 YYYY-MM-DD로.
 *
 * toISOString()을 쓰면 안 된다. 그건 UTC 기준이라 한국(UTC+9)에서는
 * 자정~오전 9시 사이에 "어제"가 나온다. scheduled_date가 date 컬럼이라
 * 하루가 통째로 어긋나는 버그가 된다.
 */
export function todayISO(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 로컬 기준 오늘로부터 n일 뒤 */
export function daysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

/** '2026-08-05' → '8월 5일 (수)' */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${m}월 ${d}일 (${weekday})`
}

export const isInbox = (t: Task) => t.status === 'inbox'
export const isActive = (t: Task) => t.status === 'active'
export const isArchived = (t: Task) => t.status === 'done' || t.status === 'dropped'

/** 3번인데 아직 날짜를 안 박은 것 — 홈 상단 카운터의 대상 */
export const isUnscheduledThree = (t: Task) =>
  t.status === 'active' && t.quadrant === 3 && !t.scheduled_date
