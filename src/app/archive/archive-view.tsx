'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
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
  const items = tasks.filter((t) => t.status === filter)
  const groups = groupByDay(items, filter)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 flex-col px-5 pt-8">
        <h1 className="text-xl font-medium">아카이브</h1>

        <div className="mt-4 flex gap-2">
          <Tab active={filter === 'done'} onClick={() => setFilter('done')}>
            완료 {tasks.filter((t) => t.status === 'done').length}
          </Tab>
          <Tab active={filter === 'dropped'} onClick={() => setFilter('dropped')}>
            버림 {tasks.filter((t) => t.status === 'dropped').length}
          </Tab>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : groups.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            {filter === 'done' ? '완료한 것 없음.' : '버린 것 없음.'}
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-6 pb-8">
            {groups.map(([day, dayTasks]) => (
              <section key={day}>
                <h2 className="text-xs text-muted">{formatDate(day)}</h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {dayTasks.map((task) => (
                    <li key={task.id} className="flex gap-2 text-sm">
                      <span className="text-xs text-muted">{task.quadrant}</span>
                      <span className={filter === 'dropped' ? 'text-muted' : undefined}>
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
      className={`rounded-lg border px-3 py-2 text-sm ${
        active ? 'border-foreground text-foreground' : 'border-border text-muted'
      }`}
    >
      {children}
    </button>
  )
}
