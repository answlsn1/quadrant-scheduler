import { todayISO } from '@/lib/tasks'
import type { Database } from '@/types/database'

export type Routine = Database['public']['Tables']['routines']['Row']
export type RoutineFreq = 'weekly' | 'monthly'

/** getDay()와 같은 0=일 … 6=토 */
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/**
 * 발생 일자를 미리 채워두는 지평.
 * 매주는 4주, 매월은 3개월 — 앱을 열 때마다 다시 채우므로 짧아도 끊기지 않는다.
 */
export const WEEKLY_HORIZON_DAYS = 28
export const MONTHLY_HORIZON_MONTHS = 3

/**
 * 오늘부터 지평 안의 발생 일자(YYYY-MM-DD, 로컬 기준)를 오름차순으로.
 * 매월 29·30·31일은 그 날짜가 없는 달에서는 조용히 건너뛴다.
 */
export function computeOccurrences(freq: RoutineFreq, days: number[]): string[] {
  const result: string[] = []
  const today = todayISO()

  if (freq === 'weekly') {
    const wanted = new Set(days)
    const cursor = new Date()
    for (let i = 0; i < WEEKLY_HORIZON_DAYS; i++) {
      if (wanted.has(cursor.getDay())) result.push(toISO(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return result
  }

  const now = new Date()
  for (let m = 0; m < MONTHLY_HORIZON_MONTHS; m++) {
    const year = now.getFullYear()
    const month = now.getMonth() + m // Date가 12 이상을 알아서 다음 해로 넘긴다
    const lastDay = new Date(year, month + 1, 0).getDate()
    for (const day of days) {
      if (day > lastDay) continue
      const date = new Date(year, month, day)
      const iso = toISO(date)
      if (iso >= today) result.push(iso)
    }
  }
  return result.sort()
}

/** '매주 월·수·금 08:00' / '매월 1일·15일' 형태의 표시 라벨 */
export function routineLabel(routine: Routine): string {
  const time = routine.scheduled_time ? ` ${routine.scheduled_time.slice(0, 5)}` : ''
  if (routine.freq === 'weekly') {
    const names = [...(routine.byweekday ?? [])]
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_LABELS[d] ?? '?')
      .join('·')
    return `매주 ${names}${time}`
  }
  const days = [...(routine.bymonthday ?? [])].sort((a, b) => a - b).join('일·')
  return `매월 ${days}일${time}`
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
