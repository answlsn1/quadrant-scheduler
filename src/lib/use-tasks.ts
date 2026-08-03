'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DROP_ON_CLASSIFY, type Quadrant } from '@/lib/quadrant'
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
    complete,
    undoTarget,
    undoComplete,
    drop,
    reschedule,
    reload,
  }
}
