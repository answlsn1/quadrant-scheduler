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

/** '2026-08-04' → '8월 4일 화요일' — 홈 헤더의 날짜 줄 */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${m}월 ${d}일 ${weekday}요일`
}

/** DB의 '14:30:00' → 화면의 '14:30' */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/**
 * 일정 표시 문자열.
 * '8월 5일 (수)' / '8월 5일 (수) 14:30' / '8월 5일 (수) 14:30 ~ 8월 10일 (월)'
 * 시간은 선택 사항이고, 기간 일정에서는 시작일에 붙는다.
 */
export function formatSchedule(task: Task): string | null {
  if (!task.scheduled_date) return null

  const start =
    formatDate(task.scheduled_date) +
    (task.scheduled_time ? ` ${formatTime(task.scheduled_time)}` : '')

  if (!task.scheduled_end_date || task.scheduled_end_date === task.scheduled_date) {
    return start
  }
  return `${start} ~ ${formatDate(task.scheduled_end_date)}`
}

/**
 * 일정이 "지난" 기준일. 기간이면 끝 날짜다 —
 * 기간 중에는 진행 중이지 늦은 게 아니다.
 */
export function scheduleDeadline(task: Task): string | null {
  return task.scheduled_end_date ?? task.scheduled_date
}

export const isInbox = (t: Task) => t.status === 'inbox'
export const isActive = (t: Task) => t.status === 'active'
export const isArchived = (t: Task) => t.status === 'done' || t.status === 'dropped'

/** 2번(일정에 넣는다)인데 아직 날짜가 없는 것 — 홈 상단 경고 띠의 대상 */
export const isUnscheduledPlan = (t: Task) =>
  t.status === 'active' && t.quadrant === 2 && !t.scheduled_date
