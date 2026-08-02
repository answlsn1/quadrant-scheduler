'use client'

import Link from 'next/link'

import { AccountMenu } from '@/components/account-menu'
import { AppNav } from '@/components/app-nav'
import { CaptureBar } from '@/components/capture-bar'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import { QUADRANT_SPEC, quadrantColor, type Quadrant } from '@/lib/quadrant'
import { isActive, isInbox, isUnscheduledThree, todayISO, type Task } from '@/lib/tasks'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'
import { useTasks } from '@/lib/use-tasks'

export function HomeView() {
  const { tasks, loading, toast, capture, complete, drop, reschedule } = useTasks()
  const keyboardInset = useKeyboardInset()

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

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">오늘</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted">인박스 {inbox.length}</span>
            <AccountMenu />
          </div>
        </header>

        {/*
         * 3번이 밀리는 게 이 앱이 풀려는 문제다. 못 본 척할 수 없어야 한다.
         * 0이면 아예 사라져서 평소에는 조용하다.
         */}
        {unscheduledThree.length > 0 ? (
          <Link
            href="/board"
            className="mt-4 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] px-3.5 py-3 text-[13px] text-warn"
          >
            <span>미배치 3번</span>
            <b className="tabular-nums">{unscheduledThree.length}</b>
            <span className="ml-auto">날짜 박기 →</span>
          </Link>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : (
          <div className="mt-6 flex flex-col gap-7 pb-6">
            <Section
              quadrant={1}
              tasks={queueOne}
              empty="지금 할 것 없음."
              onComplete={complete}
              onDrop={drop}
              onReschedule={reschedule}
            />

            <Section
              quadrant={3}
              tasks={dueThree}
              empty="오늘 박제된 것 없음."
              onComplete={complete}
              onDrop={drop}
              onReschedule={reschedule}
            />

            <details className="rounded-xl border border-dashed border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3.5 text-[13px] text-muted">
                <span className="flex items-center gap-2">
                  <i
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: quadrantColor(2) }}
                  />
                  2 · {QUADRANT_SPEC[2].verb}
                </span>
                <span className="tabular-nums">{batchTwo.length}개 ⌄</span>
              </summary>
              <ul className="px-2 pb-2">
                {batchTwo.length === 0 ? (
                  <li className="px-1.5 py-3 text-sm text-muted">몰아서 처리할 것 없음.</li>
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

      {/* 키보드가 올라오면 그만큼 밀어 올려 입력창이 항상 키보드 바로 위에 붙는다 */}
      <div
        className="shrink-0 bg-background"
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      >
        <CaptureBar onCapture={capture} />
        <AppNav inboxCount={inbox.length} />
      </div>
    </div>
  )
}

function Section({
  quadrant,
  tasks,
  empty,
  onComplete,
  onDrop,
  onReschedule,
}: {
  quadrant: Quadrant
  tasks: Task[]
  empty: string
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, date: string | null) => void
}) {
  const spec = QUADRANT_SPEC[quadrant]

  return (
    <section>
      <h2 className="flex items-center gap-2 text-[11px] tracking-wide text-muted">
        <i
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: quadrantColor(quadrant) }}
        />
        {spec.id} · {spec.verb}
      </h2>
      <ul className="mt-2">
        {tasks.length === 0 ? (
          <li className="py-2 text-sm text-muted">{empty}</li>
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
