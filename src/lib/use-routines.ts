'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { SCHEDULE_ON_CLASSIFY } from '@/lib/quadrant'
import { computeOccurrences, type Routine, type RoutineFreq } from '@/lib/routines'
import { createClient } from '@/lib/supabase/client'

/**
 * 고정 일정(루틴) 목록·생성·삭제.
 *
 * 캘린더와 설정 화면이 같은 구현을 쓴다 — 삭제 규칙이 두 벌로 갈라지면
 * 한쪽만 고쳐지는 사고가 난다.
 *
 * 규칙은 `routines`에 저장하고, 실제 일정은 보통의 `tasks` 행으로 미리 깔린다.
 * 그래서 홈·캘린더·알림이 루틴의 존재를 몰라도 그냥 동작한다.
 */
export function useRoutines() {
  const supabase = useMemo(() => createClient(), [])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('active', true)
      .order('created_at')

    if (error) setMessage('고정 일정을 불러오지 못했습니다.')
    else setRoutines(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * 제목만으로 루틴을 새로 만든다 (캘린더의 직접 입구용).
   * 인박스 항목을 변환하는 `useTasks.createRoutine`과 달리 전환할 원본이 없어
   * 모든 발생을 한 번에 넣는다.
   */
  const addRoutine = useCallback(
    async (rawTitle: string, freq: RoutineFreq, days: number[], time: string | null) => {
      if (busy) return false
      const title = rawTitle.trim()
      if (!title) return false

      // 요일은 0~6, 월 날짜는 1~31만 유효하다 (화면 밖에서 새어 든 값 방어)
      const validDays = [...new Set(days)]
        .filter((d) => (freq === 'weekly' ? d >= 0 && d <= 6 : d >= 1 && d <= 31))
        .sort((a, b) => a - b)

      const dates = computeOccurrences(freq, validDays)
      if (validDays.length === 0 || dates.length === 0) {
        setMessage('만들 수 있는 날짜가 없습니다.')
        return false
      }

      setBusy(true)
      try {
        /*
         * 규칙 + 발생 전부를 한 왕복·한 트랜잭션으로 만든다 (리뷰 발견 2026-08-04).
         *
         * 나눠 보내면 중간에 끊겼을 때 복구 불가능한 상태가 남는다:
         *  · 고수위(generated_until)만 비면 top-up이 사용자가 옮긴 발생을 되살린다
         *  · 보상 삭제를 하면 FK(on delete set null) 탓에 이미 커밋된 발생이
         *    routine_id만 끊긴 고아가 되어 목록에도 안 뜨고 지울 수도 없다
         * 두 요구(고수위 방어 / 자가 치유)는 한 값으로 양립하지 않아
         * 애초에 부분 실패가 없게 DB 함수로 묶었다.
         *
         * 날짜 계산은 여기서 한다 — 로컬 시간대 기준이라 SQL로 옮기면 어긋난다.
         */
        const { error } = await supabase.rpc('create_routine', {
          p_title: title,
          p_freq: freq,
          p_days: validDays,
          p_time: time,
          p_quadrant: SCHEDULE_ON_CLASSIFY,
          p_dates: dates,
        })

        if (error) {
          setMessage('고정 일정을 만들지 못했습니다. 다시 시도해라.')
          return false
        }

        await load()
        setMessage(`${dates.length}건을 넣었다.`)
        return true
      } finally {
        setBusy(false)
      }
    },
    [busy, supabase, load],
  )

  /**
   * 루틴과 아직 안 한 발생을 한 번에 지운다.
   * 완료·버림 이력은 남긴다 — 한 일을 없던 일로 만들지 않는다
   * (FK가 on delete set null이라 루틴만 끊기고 행은 기록에 남는다).
   */
  const removeRoutine = useCallback(
    async (id: string) => {
      if (busy) return false
      setBusy(true)
      try {
        // 규칙과 예정 발생을 한 트랜잭션으로 — 하나만 지워진 상태가 남지 않는다
        const { error } = await supabase.rpc('delete_routine', { p_id: id })
        if (error) {
          setMessage('고정 일정을 삭제하지 못했습니다. 다시 시도해라.')
          return false
        }

        setRoutines((prev) => prev.filter((r) => r.id !== id))
        setMessage('삭제했다.')
        return true
      } finally {
        setBusy(false)
      }
    },
    [busy, supabase],
  )

  return { routines, loading, busy, message, addRoutine, removeRoutine, reload: load }
}
