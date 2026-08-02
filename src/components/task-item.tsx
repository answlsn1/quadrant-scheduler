'use client'

import { useState } from 'react'

import { quadrantColor } from '@/lib/quadrant'
import { formatDate, todayISO, type Task } from '@/lib/tasks'

/** 완료 표시를 눈으로 보고 나서 목록에서 빠지게 하는 시간 */
const COMPLETE_ANIM_MS = 240

type Props = {
  task: Task
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
}

/**
 * 항목을 탭하면 동작이 펼쳐진다. (3단계 보완 — 사장님 피드백)
 *
 * 처음에는 좌측 ◯(완료)와 우측 ···(더보기)로 만들었는데,
 * "이 버튼이 정확히 뭘 하는 건지 모르겠다"는 지적을 받았다. 맞는 지적이다.
 * AGENTS.md에 "아이콘 대신 글씨를 쓴다 — 아이콘은 뜻을 배워야 한다"고
 * 적어놓고 정작 항목 줄에는 기호를 썼다.
 *
 * 이제 평소에는 제목만 보이고, 탭하면 글씨가 적힌 큰 버튼이 나온다.
 * 작업지시서 2장의 "항목 탭 → 완료/버림/날짜 변경"과도 맞는다.
 */
export function TaskItem({ task, onComplete, onDrop, onReschedule }: Props) {
  const [open, setOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  const isThree = task.quadrant === 3
  const color = completing ? 'var(--q3)' : quadrantColor(task.quadrant)
  const overdue = Boolean(
    isThree && task.scheduled_date && task.scheduled_date < todayISO(),
  )

  function handleComplete() {
    if (completing) return
    setOpen(false)
    setCompleting(true)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => onComplete(task.id), reduced ? 0 : COMPLETE_ANIM_MS)
  }

  return (
    <li
      style={{ borderLeftColor: color }}
      className={`mb-1.5 overflow-hidden rounded-xl border-l-[3px] bg-surface transition-all duration-200 ${
        completing ? 'opacity-35' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug">{task.title}</span>
          {isThree ? (
            <span className="mt-1 block text-xs">
              {task.scheduled_date ? (
                <span className={overdue ? 'text-warn' : 'text-muted'}>
                  {formatDate(task.scheduled_date)}
                  {overdue ? ' · 지남' : ''}
                </span>
              ) : (
                <span className="text-warn">미배치</span>
              )}
            </span>
          ) : null}
        </span>

        <span
          aria-hidden="true"
          className={`shrink-0 text-xs text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {open ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-2.5">
          <button
            type="button"
            onClick={handleComplete}
            className="min-h-[48px] flex-1 rounded-lg border border-[color-mix(in_srgb,var(--q3)_45%,transparent)] bg-[color-mix(in_srgb,var(--q3)_12%,transparent)] px-4 text-sm font-medium text-[var(--q3)]"
          >
            완료
          </button>
          <button
            type="button"
            onClick={() => onDrop(task.id)}
            className="min-h-[48px] flex-1 rounded-lg border border-border px-4 text-sm text-muted"
          >
            버린다
          </button>
          {isThree ? (
            <input
              type="date"
              value={task.scheduled_date ?? ''}
              onChange={(e) => onReschedule(task.id, e.target.value || null)}
              aria-label="날짜 변경"
              className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 text-sm"
            />
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
