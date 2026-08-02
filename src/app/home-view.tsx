'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AccountMenu } from '@/components/account-menu'
import { AppNav } from '@/components/app-nav'
import { CaptureBar } from '@/components/capture-bar'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import { QUADRANT_SPEC, quadrantColor, type Quadrant } from '@/lib/quadrant'
import { isActive, isInbox, isUnscheduledThree, todayISO, type Task } from '@/lib/tasks'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'
import { useTasks } from '@/lib/use-tasks'

/** 처음 안내 카드를 한 번 닫으면 다시 보여주지 않기 위한 로컬 플래그 */
const INTRO_SEEN_KEY = 'sabun.intro.seen'

export function HomeView() {
  const { tasks, loading, toast, capture, complete, drop, reschedule } = useTasks()
  const keyboardInset = useKeyboardInset()

  /*
   * 처음 온 사람용 안내 (사장님 요청 2026-08-02 — 지인 배포라 앱 설명이 필요하다).
   * 항목이 하나라도 생기면 자연히 사라지고, 닫으면 다시 안 나온다.
   * SSR에서는 localStorage가 없으므로 "본 것"으로 시작해 마운트 후 판별한다 — 깜빡임 방지.
   */
  const [introSeen, setIntroSeen] = useState(true)
  useEffect(() => {
    setIntroSeen(localStorage.getItem(INTRO_SEEN_KEY) === '1')
  }, [])

  function dismissIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setIntroSeen(true)
  }

  const today = todayISO()
  const inbox = tasks.filter(isInbox)
  const active = tasks.filter(isActive)

  const queueOne = active.filter((t) => t.quadrant === 1)
  // 오늘 것과 함께 지난 것도 올린다. 안 그러면 놓친 3번이 조용히 사라진다.
  // 정렬: 날짜 → 시간(없으면 마지막). 시간을 정했다는 건 그 시각에 하겠다는 뜻이다.
  const dueThree = active
    .filter((t) => t.quadrant === 3 && t.scheduled_date && t.scheduled_date <= today)
    .sort((a, b) => {
      const byDate = (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')
      if (byDate !== 0) return byDate
      return (a.scheduled_time ?? '99').localeCompare(b.scheduled_time ?? '99')
    })
  const batchTwo = active.filter((t) => t.quadrant === 2)
  const unscheduledThree = active.filter(isUnscheduledThree)

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">오늘의 일정</h1>
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
            <span className="ml-auto">날짜 정하기 →</span>
          </Link>
        ) : null}

        {!loading && tasks.length === 0 && !introSeen ? (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <p className="text-sm font-medium">처음이라면, 이렇게 쓴다</p>
            <ol className="mt-2.5 flex list-none flex-col gap-1.5 text-[13px] leading-relaxed text-muted">
              <li>
                <b className="text-foreground">1</b> 아래 입력창에 떠오르는 것을 그냥 적는다 —
                분류는 나중에
              </li>
              <li>
                <b className="text-foreground">2</b> 시간 날 때 <b className="text-foreground">분류</b> 탭에서
                네 칸 중 하나로 나눈다
              </li>
              <li>
                <b className="text-foreground">3</b> 이 화면에서 오늘 할 것을 실행한다
              </li>
            </ol>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <Link href="/guide" className="text-[13px] text-[var(--q3)] underline">
                자세한 사용법
              </Link>
              <button
                type="button"
                onClick={dismissIntro}
                className="min-h-[40px] px-2 text-[13px] text-muted"
              >
                닫기
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : (
          <div className="mt-6 flex flex-col gap-7 pb-6">
            <Section
              quadrant={1}
              label="지금 할 것"
              tasks={queueOne}
              empty="지금 할 것 없음."
              onComplete={complete}
              onDrop={drop}
              onReschedule={reschedule}
            />

            <Section
              quadrant={3}
              label="예정된 일정"
              tasks={dueThree}
              empty="오늘 일정에 넣어둔 것 없음."
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
        {/* 탭 이름이 "오늘의 일정"이 되면서, 입력창의 정체는 이 소제목이 말해준다 */}
        <p className="px-4 pt-2.5 text-[11px] font-medium tracking-wide text-muted">
          생각꺼내기
        </p>
        <CaptureBar onCapture={capture} />
        <AppNav inboxCount={inbox.length} />
      </div>
    </div>
  )
}

function Section({
  quadrant,
  label,
  tasks,
  empty,
  onComplete,
  onDrop,
  onReschedule,
}: {
  quadrant: Quadrant
  /**
   * 홈에서는 상태를 말하는 이름을 쓴다 — "지금 할 것", "예정된 일정".
   * 강제 동사(QUADRANT_SPEC.verb)는 분류 버튼처럼 "행동을 시키는" 자리의 것이다.
   */
  label: string
  tasks: Task[]
  empty: string
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, start: string | null, end: string | null, time: string | null) => void
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-[11px] tracking-wide text-muted">
        <i
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: quadrantColor(quadrant) }}
        />
        {quadrant} · {label}
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
