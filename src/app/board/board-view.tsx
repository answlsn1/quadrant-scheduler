'use client'

import { AppNav } from '@/components/app-nav'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import {
  BOARD_ORDER,
  QUADRANT_SPEC,
  quadrantColor,
  type Quadrant,
} from '@/lib/quadrant'
import { isActive, isInbox, type Task } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

/**
 * 2×2 전체 조망. 배치는 참고 슬라이드와 동일하게 좌상 1, 우상 3, 좌하 2, 우하 4다.
 * BOARD_ORDER가 그 순서를 들고 있으므로 여기서 순서를 다시 정하지 않는다.
 */
export function BoardView() {
  const { tasks, loading, toast, complete, drop, reschedule } = useTasks()

  const active = tasks.filter(isActive)
  const inboxCount = tasks.filter(isInbox).length
  // 4번 칸은 "버린" 칸이라 active가 없다. 최근 버린 것을 참고용으로 보여준다.
  const recentlyDropped = tasks.filter((t) => t.status === 'dropped').slice(0, 8)

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">보드</h1>
          <span className="text-xs tabular-nums text-muted">활성 {active.length}</span>
        </header>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2.5 pb-6">
            {BOARD_ORDER.map((q) => (
              <Cell
                key={q}
                quadrant={q}
                tasks={q === 4 ? recentlyDropped : active.filter((t) => t.quadrant === q)}
                onComplete={complete}
                onDrop={drop}
                onReschedule={reschedule}
              />
            ))}
          </div>
        )}
      </main>

      <Toast message={toast} />
      <AppNav inboxCount={inboxCount} />
    </div>
  )
}

function Cell({
  quadrant,
  tasks,
  onComplete,
  onDrop,
  onReschedule,
}: {
  quadrant: Quadrant
  tasks: Task[]
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
}) {
  const spec = QUADRANT_SPEC[quadrant]
  const color = quadrantColor(quadrant)
  const isDropCell = quadrant === 4

  return (
    <section
      style={{ borderColor: `color-mix(in srgb, ${color} 34%, transparent)` }}
      className="min-h-[150px] rounded-xl border p-2.5"
    >
      <h2 className="flex items-center gap-1.5 text-[11px] text-muted">
        <i className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: color }} />
        {spec.id} {spec.verb}
      </h2>

      {tasks.length === 0 ? (
        <p className="mt-3 text-[11px] text-muted">없음</p>
      ) : isDropCell ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="text-[11px] leading-snug text-muted line-through">
              {task.title}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-1.5 -mx-1">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDrop={onDrop}
              onReschedule={onReschedule}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
