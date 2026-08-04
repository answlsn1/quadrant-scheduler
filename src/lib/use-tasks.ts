'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DROP_ON_CLASSIFY, SCHEDULE_ON_CLASSIFY, type Quadrant } from '@/lib/quadrant'
import { computeOccurrences, type RoutineFreq } from '@/lib/routines'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/tasks'

/**
 * 단일 데이터 소스. 1인용 도구라 전체를 한 번에 받아 화면에서 나눠 쓴다.
 *
 * 모든 변경은 낙관적으로 처리한다 — 화면을 먼저 바꾸고 서버에 보낸다.
 * 실패하면 직전 상태로 되돌리고 토스트를 띄운다. 5초 룰상 저장을 기다리는
 * 체감이 있으면 안 되기 때문이다.
 */
export function useTasks() {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // 롤백용 스냅샷을 읽기 위한 참조. setState 업데이터 안에서 훔쳐보면
  // StrictMode의 이중 호출에 걸린다.
  const tasksRef = useRef<Task[]>([])
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  /*
   * 인박스와 활성만 받는다. 완료·버림까지 한꺼번에 받으면
   * 기록이 쌓일수록 상한(1000)에 걸려 오래된 활성 항목이 조용히 목록에서
   * 밀려난다. 예를 들어 반년 뒤 날짜를 박아둔 3번은 created_at이 오래돼서
   * 가장 먼저 잘려나간다. 처리해야 할 것이 사라지는 셈이라 그냥 둘 수 없다.
   * 기록 화면은 useArchive가 따로 받는다.
   */
  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['inbox', 'active'])
      .order('created_at', { ascending: false })

    if (error) {
      notify('목록을 불러오지 못했습니다.')
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [supabase, notify])

  useEffect(() => {
    void reload()
  }, [reload])

  // 폰에서 담고 데스크탑에서 처리하는 전제라, 탭이 다시 보일 때마다 최신을 받는다.
  // 이게 기기 간 동기화의 실질적인 장치다.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') void reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [reload])

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      if (undoTimer.current) clearTimeout(undoTimer.current)
    },
    [],
  )

  const optimistic = useCallback(
    async (
      apply: (prev: Task[]) => Task[],
      send: () => PromiseLike<{ error: unknown }>,
      failMessage: string,
    ) => {
      const snapshot = tasksRef.current
      setTasks(apply(snapshot))

      const { error } = await send()
      if (error) {
        setTasks(snapshot)
        notify(failMessage)
        return false
      }
      return true
    },
    [notify],
  )

  const patch = useCallback(
    (id: string, changes: Partial<Task>, failMessage: string) =>
      optimistic(
        (prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)),
        () => supabase.from('tasks').update(changes).eq('id', id),
        failMessage,
      ),
    [optimistic, supabase],
  )

  /**
   * 캡처 — 먼저 인박스로 저장한다 (5초 룰: 저장이 분류를 기다리지 않는다).
   * 성공하면 새 항목의 id를 돌려준다 — 홈이 그 항목으로 분류 패널을 연다.
   */
  const capture = useCallback(
    async (rawTitle: string): Promise<string | null> => {
      const title = rawTitle.trim()
      if (!title) return null

      // id를 클라이언트에서 만들어 두면 롤백과 후속 조작이 단순해진다.
      const id = crypto.randomUUID()
      const draft: Task = {
        id,
        user_id: '',
        title,
        note: null,
        quadrant: null,
        status: 'inbox',
        routine_id: null,
        scheduled_date: null,
        scheduled_end_date: null,
        scheduled_time: null,
        created_at: new Date().toISOString(),
        completed_at: null,
        dropped_at: null,
      }

      const ok = await optimistic(
        (prev) => [draft, ...prev],
        () => supabase.from('tasks').insert({ id, title }),
        '저장하지 못했습니다. 다시 시도해 주세요.',
      )
      return ok ? id : null
    },
    [optimistic, supabase],
  )

  /**
   * 분류. 4번은 강제 동사가 "버린다"이므로 active를 거치지 않고 바로 버린다.
   * 분류만 하고 멈추는 흐름을 만들지 않는다 (원칙 2).
   * 3번은 기간(시작~끝)으로도 정할 수 있다. 끝이 없으면 하루짜리다.
   */
  const classify = useCallback(
    (
      id: string,
      quadrant: Quadrant,
      scheduledDate?: string | null,
      scheduledEndDate?: string | null,
      scheduledTime?: string | null,
    ) => {
      const now = new Date().toISOString()
      const start = scheduledDate ?? null
      const changes: Partial<Task> =
        quadrant === DROP_ON_CLASSIFY
          ? { quadrant, status: 'dropped', dropped_at: now }
          : {
              quadrant,
              status: 'active',
              scheduled_date: start,
              // 시작 없이 끝·시간만 있을 수 없다 (DB CHECK와 동일 규칙)
              scheduled_end_date: start ? (scheduledEndDate ?? null) : null,
              scheduled_time: start ? (scheduledTime ?? null) : null,
            }

      return patch(id, changes, '분류를 저장하지 못했습니다.')
    },
    [patch],
  )

  /*
   * 완료 직후 몇 초간 실행취소를 열어둔다 (사장님 승인 2026-08-03).
   * 흔들리는 폰에서 오폭했을 때 기록 탭까지 가지 않고 그 자리에서 되돌린다.
   */
  const [undoTarget, setUndoTarget] = useState<Task | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * 이미 분류된 항목을 다른 칸으로 옮긴다 (사장님 지시 2026-08-04).
   *
   * `classify`(인박스 → 칸)와 다른 점은 **기존 일정을 보존**한다는 것이다.
   * 옮긴다고 날짜를 날려버리면 사용자가 다시 잡아야 한다.
   * 다만 칸의 의미가 바뀌므로 최소한의 정리는 한다:
   *  - 4번(버린다)으로 → 강제 동사대로 즉시 버림 처리
   *  - 2번(일정)이 아닌 칸으로 → 기간(끝 날짜)은 2번 전용이라 지운다.
   *    시작 날짜와 시간은 남긴다 (1번은 시간을, 3번도 날짜를 쓸 수 있다)
   *  - 루틴 발생을 다른 칸으로 옮기면 루틴에서 분리한다 —
   *    "이 발생만 성격이 달라졌다"는 뜻이고, top-up이 되살리지 않게 한다
   */
  const moveQuadrant = useCallback(
    (task: Task, quadrant: Quadrant) => {
      if (task.quadrant === quadrant) return Promise.resolve(true)

      const now = new Date().toISOString()
      const changes: Partial<Task> =
        quadrant === DROP_ON_CLASSIFY
          ? { quadrant, status: 'dropped', dropped_at: now, routine_id: null }
          : {
              quadrant,
              status: 'active',
              scheduled_end_date: quadrant === SCHEDULE_ON_CLASSIFY ? task.scheduled_end_date : null,
              routine_id: null,
            }

      return patch(task.id, changes, '칸을 옮기지 못했습니다.')
    },
    [patch],
  )

  const complete = useCallback(
    async (id: string) => {
      const snapshot = tasksRef.current.find((t) => t.id === id) ?? null
      const ok = await patch(
        id,
        { status: 'done', completed_at: new Date().toISOString() },
        '완료 처리를 저장하지 못했습니다.',
      )
      if (ok && snapshot) {
        setUndoTarget(snapshot)
        if (undoTimer.current) clearTimeout(undoTimer.current)
        undoTimer.current = setTimeout(() => setUndoTarget(null), 4000)
      }
      return ok
    },
    [patch],
  )

  const undoComplete = useCallback(() => {
    const target = undoTarget
    if (!target) return Promise.resolve(false)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoTarget(null)
    return patch(
      target.id,
      { status: 'active', completed_at: null },
      '되돌리지 못했습니다.',
    )
  }, [undoTarget, patch])

  const drop = useCallback(
    (id: string) =>
      patch(
        id,
        { status: 'dropped', dropped_at: new Date().toISOString() },
        '버림 처리를 저장하지 못했습니다.',
      ),
    [patch],
  )

  /**
   * 인박스 항목을 반복 루틴으로 만든다 (사장님 지시 2026-08-03).
   * 규칙은 routines에, 발생 일자는 보통의 tasks 행으로 미리 깔린다 —
   * 원래 항목이 첫 발생이 되고 나머지는 새 행으로 들어간다.
   */
  const createRoutine = useCallback(
    async (task: Task, freq: RoutineFreq, days: number[], time: string | null) => {
      // 화면 밖에서 새어 들어온 값 방어 (리뷰 발견: weekly↔monthly 전환 잔존값).
      // 요일은 0~6, 월 날짜는 1~31만 유효하다.
      const validDays = [...new Set(days)]
        .filter((d) => (freq === 'weekly' ? d >= 0 && d <= 6 : d >= 1 && d <= 31))
        .sort((a, b) => a - b)

      const dates = computeOccurrences(freq, validDays)
      if (validDays.length === 0 || dates.length === 0) {
        notify('만들 수 있는 날짜가 없습니다.')
        return false
      }

      const [first, ...rest] = dates
      const last = dates[dates.length - 1]

      const routineId = crypto.randomUUID()
      // generated_until은 일단 첫 발생까지로 잡는다 — 나머지 생성이 실패하면
      // 다음 top-up이 이어서 채운다 (자가 치유).
      const { error: routineError } = await supabase.from('routines').insert({
        id: routineId,
        title: task.title,
        freq,
        byweekday: freq === 'weekly' ? validDays : null,
        bymonthday: freq === 'monthly' ? validDays : null,
        scheduled_time: time,
        generated_until: first,
      })
      if (routineError) {
        notify('루틴을 만들지 못했습니다.')
        return false
      }
      const ok = await patch(
        task.id,
        {
          quadrant: SCHEDULE_ON_CLASSIFY,
          status: 'active',
          scheduled_date: first,
          scheduled_end_date: null,
          scheduled_time: time,
          routine_id: routineId,
        },
        '루틴 일정을 저장하지 못했습니다.',
      )

      if (!ok) {
        // 보상 삭제 (리뷰 발견: 고아 루틴). 규칙만 남으면 다음 실행 때
        // 실패했다고 안내한 일정이 몰래 생성되고, 재시도하면 통째로 중복된다.
        await supabase.from('routines').delete().eq('id', routineId)
        return false
      }

      if (rest.length > 0) {
        const rows = rest.map((date) => ({
          id: crypto.randomUUID(),
          title: task.title,
          quadrant: SCHEDULE_ON_CLASSIFY,
          status: 'active',
          scheduled_date: date,
          scheduled_time: time,
          routine_id: routineId,
        }))
        const { error: bulkError } = await supabase
          .from('tasks')
          .upsert(rows, { onConflict: 'routine_id,scheduled_date', ignoreDuplicates: true })

        if (bulkError) {
          // generated_until이 first에 머물러 있으므로 다음 top-up이 이어서 채운다
          notify('반복 일정 일부를 만들지 못했습니다. 앱을 다시 열면 채워집니다.')
        } else {
          await supabase.from('routines').update({ generated_until: last }).eq('id', routineId)
          const now = new Date().toISOString()
          const fullRows: Task[] = rows.map((r) => ({
            ...r,
            user_id: '',
            note: null,
            scheduled_end_date: null,
            created_at: now,
            completed_at: null,
            dropped_at: null,
          }))
          setTasks((prev) => [...fullRows, ...prev])
        }
      }
      return ok
    },
    [notify, patch, supabase],
  )

  /*
   * 루틴 발생 일자를 지평만큼 "이어서" 채운다. 앱을 열 때 한 번.
   *
   * 핵심은 generated_until 고수위다 (리뷰 발견 반영): 이미 생성한 구간 안에서는
   * 사용자가 발생을 옮기든 지우든 절대 다시 만들지 않는다 — 그 너머만 만든다.
   * 유니크 + on conflict ignore는 여러 기기가 동시에 돌 때의 안전벨트로만 남는다.
   */
  const toppedUp = useRef(false)
  useEffect(() => {
    if (toppedUp.current) return
    toppedUp.current = true

    void (async () => {
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .eq('active', true)
      if (!routines || routines.length === 0) return

      const rows: {
        id: string
        title: string
        quadrant: number
        status: string
        scheduled_date: string
        scheduled_time: string | null
        routine_id: string
      }[] = []
      const advanceTo = new Map<string, string>()

      for (const routine of routines) {
        const occurrences = computeOccurrences(
          routine.freq as RoutineFreq,
          (routine.freq === 'weekly' ? routine.byweekday : routine.bymonthday) ?? [],
        )
        if (occurrences.length === 0) continue

        const horizonEnd = occurrences[occurrences.length - 1]
        const fresh = occurrences.filter((d) => d > (routine.generated_until ?? ''))
        if (fresh.length === 0) continue

        for (const date of fresh) {
          rows.push({
            id: crypto.randomUUID(),
            title: routine.title,
            quadrant: SCHEDULE_ON_CLASSIFY,
            status: 'active',
            scheduled_date: date,
            scheduled_time: routine.scheduled_time,
            routine_id: routine.id,
          })
        }
        advanceTo.set(routine.id, horizonEnd)
      }
      if (rows.length === 0) return

      const { error } = await supabase
        .from('tasks')
        .upsert(rows, { onConflict: 'routine_id,scheduled_date', ignoreDuplicates: true })
      if (error) return

      // 삽입이 성공한 뒤에만 고수위를 올린다 — 실패하면 다음 기회에 다시 시도된다
      for (const [routineId, until] of advanceTo) {
        await supabase.from('routines').update({ generated_until: until }).eq('id', routineId)
      }
      void reload()
    })()
  }, [supabase, reload])

  const reschedule = useCallback(
    (
      id: string,
      scheduledDate: string | null,
      scheduledEndDate: string | null = null,
      scheduledTime: string | null = null,
    ) =>
      patch(
        id,
        {
          scheduled_date: scheduledDate,
          scheduled_end_date: scheduledDate ? scheduledEndDate : null,
          scheduled_time: scheduledDate ? scheduledTime : null,
          /*
           * 루틴 발생을 손으로 편집하면 루틴에서 떨어져 나와 일회성이 된다
           * (구글캘린더의 "이 일정만 변경"과 같은 의미 — 리뷰 발견 반영).
           * 이걸 안 끊으면: 같은 루틴의 다른 발생 날짜로 옮길 때 유니크 충돌로
           * 저장이 항상 실패하고, top-up 고수위와도 얽힌다.
           * 루틴이 아닌 항목은 어차피 null이라 무해하다.
           */
          routine_id: null,
        },
        '날짜를 저장하지 못했습니다.',
      ),
    [patch],
  )

  return {
    tasks,
    loading,
    toast,
    capture,
    classify,
    createRoutine,
    moveQuadrant,
    complete,
    undoTarget,
    undoComplete,
    drop,
    reschedule,
    reload,
  }
}
