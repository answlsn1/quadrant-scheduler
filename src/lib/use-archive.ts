'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/tasks'

/** 기록 화면에 한 번에 올리는 최대 건수 */
const PAGE = 500
/** 내보내기는 잘리면 안 되므로 이 크기로 끝까지 넘긴다 */
const EXPORT_PAGE = 1000

/**
 * 기록(완료·버림) 전용. 작업 목록과 분리한 이유는 `useTasks` 주석에 있다.
 * 개수는 실제 count로 받는다 — 받아온 목록으로 세면 잘린 뒤부터 거짓말을 한다.
 */
export function useArchive() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Task[]>([])
  const [counts, setCounts] = useState({ done: 0, dropped: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [list, done, dropped] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .in('status', ['done', 'dropped'])
        .order('created_at', { ascending: false })
        .limit(PAGE),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done'),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dropped'),
    ])

    if (list.error) {
      setError('기록을 불러오지 못했습니다.')
    } else {
      setItems(list.data ?? [])
      setCounts({ done: done.count ?? 0, dropped: dropped.count ?? 0 })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * 백업용 전체 내보내기. 상한에 걸려 조용히 잘리면 백업이 아니므로
   * 끝까지 페이지를 넘긴다.
   */
  const fetchAllForExport = useCallback(async (): Promise<Task[] | null> => {
    const all: Task[] = []

    for (let from = 0; ; from += EXPORT_PAGE) {
      const { data, error: pageError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, from + EXPORT_PAGE - 1)

      if (pageError) return null
      all.push(...(data ?? []))
      if (!data || data.length < EXPORT_PAGE) break
    }

    return all
  }, [supabase])

  /**
   * 되돌리기. 잘못 눌러 넘어온 것을 복구한다 (사장님 요청 2026-08-02).
   *
   * 어디로 돌아가는가:
   * - 1·2·3번 → 다시 활성(active). 사분면·날짜는 그대로 남아 있어 원래 자리로 돌아간다.
   * - 4번 → 인박스. 4번은 강제 동사가 "버린다"라 active 상태가 존재할 수 없는 칸이다
   *   (홈·스케줄러 어디에도 active 4번을 그리는 자리가 없다). 분류부터 다시 거치게 한다.
   */
  const restore = useCallback(
    async (task: Task) => {
      const bucket = task.status as 'done' | 'dropped'

      // 낙관적으로 목록·카운트에서 먼저 뺀다
      setItems((prev) => prev.filter((t) => t.id !== task.id))
      setCounts((prev) => ({ ...prev, [bucket]: Math.max(0, prev[bucket] - 1) }))

      const changes =
        task.quadrant === 4
          ? { status: 'inbox', quadrant: null, completed_at: null, dropped_at: null }
          : { status: 'active', completed_at: null, dropped_at: null }

      const { error: restoreError } = await supabase
        .from('tasks')
        .update(changes)
        .eq('id', task.id)

      if (restoreError) {
        void load() // 실패하면 서버 상태로 되돌린다
        return false
      }
      return true
    },
    [supabase, load],
  )

  const shown = items.length
  const total = counts.done + counts.dropped

  return {
    items,
    counts,
    loading,
    error,
    /** 상한에 걸려 일부만 보여주고 있는지 */
    truncated: total > shown,
    fetchAllForExport,
    restore,
  }
}
