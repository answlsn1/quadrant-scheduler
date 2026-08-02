'use client'

import { useRef, useState, type FormEvent } from 'react'

import { AppNav } from '@/components/app-nav'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import { QUADRANT_SPEC } from '@/lib/quadrant'
import { isActive, isInbox, isUnscheduledThree, todayISO } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

export function HomeView() {
  const { tasks, loading, toast, capture, complete, drop, reschedule } = useTasks()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const today = todayISO()
  const inbox = tasks.filter(isInbox)
  const active = tasks.filter(isActive)

  const queueOne = active.filter((t) => t.quadrant === 1)
  // 오늘 것과 함께 지난 것도 올린다. 안 그러면 놓친 3번이 조용히 사라진다.
  const dueThree = active.filter(
    (t) => t.quadrant === 3 && t.scheduled_date && t.scheduled_date <= today,
  )
  const batchTwo = active.filter((t) => t.quadrant === 2)
  const unscheduledThree = active.filter(isUnscheduledThree)

  async function handleCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = draft
    if (!value.trim()) return

    // 먼저 비우고 포커스를 유지한다. 연속으로 쏟아붓는 흐름이 끊기면 안 된다.
    setDraft('')
    inputRef.current?.focus()

    const ok = await capture(value)
    if (!ok) setDraft(value) // 실패했으면 쓴 내용을 돌려준다
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 flex-col px-5 pt-8">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-medium">오늘</h1>
          <form action="/logout" method="post">
            <button type="submit" className="text-xs text-muted underline">
              로그아웃
            </button>
          </form>
        </header>

        {/* 미배치 3번은 이 앱의 승부처라 항상 위에 세워둔다 */}
        <div className="mt-2 flex gap-3 text-xs text-muted">
          <span>인박스 {inbox.length}</span>
          <span className={unscheduledThree.length > 0 ? 'text-amber-400' : undefined}>
            미배치 3번 {unscheduledThree.length}
          </span>
        </div>

        <form onSubmit={handleCapture} className="mt-4">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            enterKeyHint="done"
            autoComplete="off"
            placeholder="떠오른 것을 그냥 적는다"
            aria-label="캡처"
            className="w-full rounded-lg border border-border bg-transparent px-3.5 py-3.5 outline-none focus:border-foreground"
          />
        </form>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : (
          <div className="mt-8 flex flex-col gap-8 pb-8">
            <Section
              quadrantId={1}
              tasks={queueOne}
              empty="지금 할 것 없음."
              onComplete={complete}
              onDrop={drop}
              onReschedule={reschedule}
            />

            <Section
              quadrantId={3}
              tasks={dueThree}
              empty="오늘 박제된 것 없음."
              onComplete={complete}
              onDrop={drop}
              onReschedule={reschedule}
            />

            <details className="group">
              <summary className="cursor-pointer list-none text-sm text-muted">
                2 · {QUADRANT_SPEC[2].verb} ({batchTwo.length})
              </summary>
              <ul className="mt-2">
                {batchTwo.length === 0 ? (
                  <li className="py-3 text-sm text-muted">몰아서 처리할 것 없음.</li>
                ) : (
                  batchTwo.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={complete}
                      onDrop={drop}
                      onReschedule={reschedule}
                    />
                  ))
                )}
              </ul>
            </details>
          </div>
        )}
      </main>

      <Toast message={toast} />
      <AppNav inboxCount={inbox.length} />
    </div>
  )
}

function Section({
  quadrantId,
  tasks,
  empty,
  onComplete,
  onDrop,
  onReschedule,
}: {
  quadrantId: 1 | 3
  tasks: ReturnType<typeof useTasks>['tasks']
  empty: string
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
}) {
  const spec = QUADRANT_SPEC[quadrantId]

  return (
    <section>
      <h2 className="text-sm text-muted">
        {spec.id} · {spec.verb}
      </h2>
      <ul className="mt-2">
        {tasks.length === 0 ? (
          <li className="py-3 text-sm text-muted">{empty}</li>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDrop={onDrop}
              onReschedule={onReschedule}
            />
          ))
        )}
      </ul>
    </section>
  )
}
