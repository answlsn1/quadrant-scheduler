'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
import { quadrantColor } from '@/lib/quadrant'
import { formatDate, isInbox, type Task } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

type Filter = 'done' | 'dropped'

/**
 * 완료와 버림을 날짜별로 본다.
 * 4번은 "죄책감 없이 기록하고 버린다"가 취지라, 버린 것도 지우지 않고 남긴다.
 */
export function ArchiveView() {
  const { tasks, loading, toast } = useTasks()
  const [filter, setFilter] = useState<Filter>('done')

  const inboxCount = tasks.filter(isInbox).length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const droppedCount = tasks.filter((t) => t.status === 'dropped').length
  const groups = groupByDay(tasks.filter((t) => t.status === filter), filter)

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">기록</h1>

        <div className="mt-4 flex gap-2">
          <Tab active={filter === 'done'} onClick={() => setFilter('done')}>
            완료 {doneCount}
          </Tab>
          <Tab active={filter === 'dropped'} onClick={() => setFilter('dropped')}>
            버림 {droppedCount}
          </Tab>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : groups.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            {filter === 'done' ? '완료한 것 없음.' : '버린 것 없음.'}
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-5 pb-6">
            {groups.map(([day, dayTasks]) => (
              <section key={day}>
                <h2 className="text-[11px] text-muted">{formatDate(day)}</h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {dayTasks.map((task) => (
                    <li
                      key={task.id}
                      style={{ borderLeftColor: quadrantColor(task.quadrant) }}
                      className="rounded-lg border-l-[3px] bg-surface px-3 py-2.5 text-sm"
                    >
                      <span className={filter === 'dropped' ? 'text-muted line-through' : undefined}>
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <Toast message={toast} />
      <AppNav inboxCount={inboxCount} />
    </div>
  )
}

/** completed_at / dropped_at을 로컬 날짜로 묶는다 (UTC로 자르면 하루가 어긋난다) */
function groupByDay(items: Task[], filter: Filter): [string, Task[]][] {
  const map = new Map<string, Task[]>()

  for (const task of items) {
    const stamp = filter === 'done' ? task.completed_at : task.dropped_at
    if (!stamp) continue

    const d = new Date(stamp)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`

    const bucket = map.get(day)
    if (bucket) bucket.push(task)
    else map.set(day, [task])
  }

  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] rounded-xl border px-4 text-sm tabular-nums ${
        active ? 'border-foreground text-foreground' : 'border-border text-muted'
      }`}
    >
      {children}
    </button>
  )
}
