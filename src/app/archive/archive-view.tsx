'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
import { quadrantColor } from '@/lib/quadrant'
import { formatDate, todayISO, type Task } from '@/lib/tasks'
import { useArchive } from '@/lib/use-archive'

type Filter = 'done' | 'dropped'

/**
 * 완료와 버림을 날짜별로 본다.
 * 4번은 "죄책감 없이 기록하고 버린다"가 취지라, 버린 것도 지우지 않고 남긴다.
 */
export function ArchiveView() {
  const { items, counts, loading, error, truncated, fetchAllForExport, restore } = useArchive()
  const [filter, setFilter] = useState<Filter>('done')
  const [exportState, setExportState] = useState<'idle' | 'working' | 'failed'>('idle')

  const groups = groupByDay(items.filter((t) => t.status === filter), filter)

  async function handleExport() {
    setExportState('working')
    const all = await fetchAllForExport()

    if (!all) {
      setExportState('failed')
      return
    }

    const blob = new Blob(
      [
        JSON.stringify(
          { app: 'Q-Do', exportedAt: new Date().toISOString(), count: all.length, tasks: all },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Q-Do-백업-${todayISO()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setExportState('idle')
  }

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">기록</h1>

        <div className="mt-4 flex gap-2">
          <Tab active={filter === 'done'} onClick={() => setFilter('done')}>
            완료 {counts.done}
          </Tab>
          <Tab active={filter === 'dropped'} onClick={() => setFilter('dropped')}>
            버림 {counts.dropped}
          </Tab>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : groups.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            {filter === 'done' ? '완료한 것 없음.' : '버린 것 없음.'}
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            {groups.map(([day, dayTasks]) => (
              <section key={day}>
                <h2 className="text-[11px] text-muted">{formatDate(day)}</h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {dayTasks.map((task) => (
                    <li
                      key={task.id}
                      style={{ borderLeftColor: quadrantColor(task.quadrant) }}
                      className="flex items-center gap-2 rounded-lg border-l-[3px] bg-surface py-1 pl-3 pr-1 text-sm"
                    >
                      <span
                        className={`min-w-0 flex-1 py-1.5 ${
                          filter === 'dropped' ? 'text-muted line-through' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {/* 잘못 눌러 넘어온 것의 복구 경로. 4번은 인박스로, 나머지는 원래 자리로. */}
                      <button
                        type="button"
                        onClick={() => void restore(task)}
                        className="min-h-[44px] shrink-0 rounded-lg px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground"
                      >
                        되돌리기
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {truncated ? (
          <p className="mt-6 text-xs text-muted">
            최근 것부터 일부만 보여주고 있다. 전부는 아래 내보내기로 받는다.
          </p>
        ) : null}

        {/* 자가도구의 최소 안전장치. 서버를 거치지 않고 브라우저에서 바로 만든다. */}
        <div className="mt-8 border-t border-border pt-5 pb-6">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportState === 'working'}
            className="min-h-[48px] w-full rounded-xl border border-border px-4 text-sm text-muted disabled:opacity-50"
          >
            {exportState === 'working' ? '모으는 중' : '전체 내보내기 (JSON)'}
          </button>
          {exportState === 'failed' ? (
            <p role="alert" className="mt-2 text-xs text-[var(--q1)]">
              내보내기에 실패했다. 다시 시도해라.
            </p>
          ) : null}
        </div>
      </main>

      <Toast message={error} />
      <AppNav />
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
