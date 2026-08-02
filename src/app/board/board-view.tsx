'use client'

import { AppNav } from '@/components/app-nav'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import { BOARD_ORDER, QUADRANT_SPEC, type Quadrant } from '@/lib/quadrant'
import { isActive, isInbox } from '@/lib/tasks'
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
  const recentlyDropped = tasks
    .filter((t) => t.status === 'dropped')
    .slice(0, 10)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 flex-col px-5 pt-8">
        <h1 className="text-xl font-medium">보드</h1>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
            {BOARD_ORDER.map((q) => (
              <Cell
                key={q}
                quadrant={q}
                tasks={q === 4 ? recentlyDropped : active.filter((t) => t.quadrant === q)}
                onComplete={complete}
                onDrop={drop}
                onReschedule={reschedule}
                readOnly={q === 4}
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
  readOnly,
}: {
  quadrant: Quadrant
  tasks: ReturnType<typeof useTasks>['tasks']
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
  readOnly: boolean
}) {
  const spec = QUADRANT_SPEC[quadrant]

  return (
    <section className="min-h-40 rounded-lg border border-border p-3">
      <h2 className="text-xs text-muted">
        {spec.id} · {spec.verb}
      </h2>

      {tasks.length === 0 ? (
        <p className="mt-3 text-xs text-muted">없음</p>
      ) : readOnly ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="text-xs text-muted line-through">
              {task.title}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-1">
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
