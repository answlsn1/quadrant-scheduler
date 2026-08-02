'use client'

import { useState } from 'react'

import { quadrantColor } from '@/lib/quadrant'
import { formatDate, todayISO, type Task } from '@/lib/tasks'

/** 체크가 차오르는 걸 눈으로 보고 나서 목록에서 빠지게 하는 시간 */
const COMPLETE_ANIM_MS = 240

type Props = {
  task: Task
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
}

export function TaskItem({ task, onComplete, onDrop, onReschedule }: Props) {
  const [completing, setCompleting] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const color = quadrantColor(task.quadrant)
  const isThree = task.quadrant === 3
  const overdue = Boolean(
    isThree && task.scheduled_date && task.scheduled_date < todayISO(),
  )

  function handleComplete() {
    if (completing) return
    setCompleting(true)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => onComplete(task.id), reduced ? 0 : COMPLETE_ANIM_MS)
  }

  return (
    <li
      style={{ borderLeftColor: color }}
      className={`mb-1.5 rounded-xl border-l-[3px] bg-surface transition-opacity duration-200 ${
        completing ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-1">
        {/* 완료는 가장 자주 쓰는 동작이라 한 번에 닿게 둔다. 48px 타겟. */}
        <button
          type="button"
          onClick={handleComplete}
          aria-label={`완료: ${task.title}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center"
        >
          <span
            style={
              completing
                ? { borderColor: 'var(--q3)', background: 'var(--q3)' }
                : undefined
            }
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-border transition-all duration-200"
          >
            {completing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M2.5 7.2 5.7 10.3 11.5 4"
                  fill="none"
                  stroke="var(--background)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        </button>

        <div className="min-w-0 flex-1 py-3">
          <p className="text-sm leading-snug">{task.title}</p>
          {isThree ? (
            <p className="mt-1 text-xs">
              {task.scheduled_date ? (
                <span className={overdue ? 'text-warn' : 'text-muted'}>
                  {formatDate(task.scheduled_date)}
                  {overdue ? ' · 지남' : ''}
                </span>
              ) : (
                <span className="text-warn">미배치</span>
              )}
            </p>
          ) : null}
        </div>

        {/* 되돌리기 어려운 버림은 한 단계 뒤로 숨긴다. 완료 버튼 옆 오폭을 막는다. */}
        <button
          type="button"
          onClick={() => setActionsOpen((v) => !v)}
          aria-label={`${task.title} 다른 동작`}
          aria-expanded={actionsOpen}
          className="flex h-12 w-12 shrink-0 items-center justify-center text-muted"
        >
          <span className="tracking-widest">···</span>
        </button>
      </div>

      {actionsOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
          {isThree ? (
            <input
              type="date"
              value={task.scheduled_date ?? ''}
              onChange={(e) => onReschedule(task.id, e.target.value || null)}
              aria-label="날짜 변경"
              className="min-h-[44px] rounded-lg border border-border bg-transparent px-3 text-sm"
            />
          ) : null}
          <button
            type="button"
            onClick={() => onDrop(task.id)}
            className="ml-auto min-h-[44px] rounded-lg border border-border px-4 text-sm text-muted"
          >
            버린다
          </button>
        </div>
      ) : null}
    </li>
  )
}
