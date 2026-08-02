'use client'

import { QUADRANT_SPEC, isQuadrant } from '@/lib/quadrant'
import { todayISO, type Task } from '@/lib/tasks'

type Props = {
  task: Task
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
  /** 보드처럼 여러 사분면이 섞이는 화면에서 칸 번호를 같이 보여준다 */
  showQuadrant?: boolean
}

export function TaskItem({
  task,
  onComplete,
  onDrop,
  onReschedule,
  showQuadrant = false,
}: Props) {
  const overdue =
    task.quadrant === 3 && task.scheduled_date && task.scheduled_date < todayISO()

  return (
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <span className="flex-1 text-sm leading-snug">
          {showQuadrant && isQuadrant(task.quadrant) ? (
            <span className="mr-1.5 text-xs text-muted">
              {task.quadrant}·{QUADRANT_SPEC[task.quadrant].verb}
            </span>
          ) : null}
          {task.title}
        </span>

        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            className="rounded border border-border px-2.5 py-1.5 text-xs text-muted"
          >
            완료
          </button>
          <button
            type="button"
            onClick={() => onDrop(task.id)}
            className="rounded border border-border px-2.5 py-1.5 text-xs text-muted"
          >
            버림
          </button>
        </div>
      </div>

      {/* 3번은 날짜를 박아야 실행된다. 그래서 3번에만 날짜 컨트롤을 상시 노출한다. */}
      {task.quadrant === 3 ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={task.scheduled_date ?? ''}
            onChange={(e) => onReschedule(task.id, e.target.value || null)}
            className="rounded border border-border bg-transparent px-2 py-1 text-xs"
          />
          {!task.scheduled_date ? (
            <span className="text-xs text-amber-400">미배치</span>
          ) : null}
          {overdue ? <span className="text-xs text-red-400">지남</span> : null}
        </div>
      ) : null}
    </li>
  )
}
