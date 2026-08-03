'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AccountMenu } from '@/components/account-menu'
import { AppNav } from '@/components/app-nav'
import { CaptureBar } from '@/components/capture-bar'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import {
  BOARD_ORDER,
  QUADRANT_SPEC,
  quadrantColor,
  type Quadrant,
} from '@/lib/quadrant'
import {
  daysFromToday,
  isActive,
  isInbox,
  isUnscheduledPlan,
  scheduleDeadline,
  todayISO,
  type Task,
} from '@/lib/tasks'
import { useArchive } from '@/lib/use-archive'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'
import { useTasks } from '@/lib/use-tasks'

/** 처음 안내 카드를 한 번 닫으면 다시 보여주지 않기 위한 로컬 플래그 */
const INTRO_SEEN_KEY = 'sabun.intro.seen'

type DayTab = 'today' | 'tomorrow'

/**
 * 통합 홈 (2026-08-03 사장님 결정 — 스케줄러 탭을 여기로 합쳤다).
 *
 * 위: [오늘 할 일 | 내일 할 일] 서브탭 — 그날 할 것만.
 * 아래: 사분면 전체 — 모바일에서 2×2를 억지로 유지하지 않고 세로로 줄내림.
 * 이 앱의 중심은 "간편하게 적고, 간편하게 확인"이다.
 */
export function HomeView() {
  const { tasks, loading, toast, capture, complete, drop, reschedule } = useTasks()
  // 4번 칸의 "최근 버린 것" 표시용. 버린 항목은 작업 목록에 없다.
  const { items: archived } = useArchive()
  const keyboardInset = useKeyboardInset()

  const [dayTab, setDayTab] = useState<DayTab>('today')

  /*
   * 사분면 전체는 기본 접힘 — 개수만 보인다 (사장님 지시 2026-08-03).
   * 펼침 상태는 세션 안에서만 유지한다. details 대신 상태로 관리하는 이유는
   * 위의 "날짜 없는 일정" 띠를 눌렀을 때 2번 칸을 코드로 펼쳐야 하기 때문.
   */
  const [openQuadrants, setOpenQuadrants] = useState<Set<Quadrant>>(new Set())
  function toggleQuadrant(q: Quadrant) {
    setOpenQuadrants((prev) => {
      const next = new Set(prev)
      if (next.has(q)) next.delete(q)
      else next.add(q)
      return next
    })
  }
  function revealUnscheduled() {
    setOpenQuadrants((prev) => new Set(prev).add(2))
    document.getElementById('quadrants')?.scrollIntoView({ behavior: 'smooth' })
  }

  const [introSeen, setIntroSeen] = useState(true)
  useEffect(() => {
    setIntroSeen(localStorage.getItem(INTRO_SEEN_KEY) === '1')
  }, [])
  function dismissIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    setIntroSeen(true)
  }

  const today = todayISO()
  const tomorrow = daysFromToday(1)
  const inbox = tasks.filter(isInbox)
  const active = tasks.filter(isActive)
  const unscheduledPlan = active.filter(isUnscheduledPlan)

  const byTime = (a: Task, b: Task) => {
    const byDate = (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')
    if (byDate !== 0) return byDate
    return (a.scheduled_time ?? '99').localeCompare(b.scheduled_time ?? '99')
  }

  const queueNow = active.filter((t) => t.quadrant === 1)
  // 오늘: 지난 것도 올린다 — 놓친 일정이 조용히 사라지면 안 된다.
  const dueToday = active
    .filter((t) => t.quadrant === 2 && t.scheduled_date && t.scheduled_date <= today)
    .sort(byTime)
  // 내일: 내일이 기간 창에 드는 예정 항목만.
  const dueTomorrow = active
    .filter(
      (t) =>
        t.quadrant === 2 &&
        t.scheduled_date &&
        t.scheduled_date <= tomorrow &&
        (scheduleDeadline(t) ?? '') >= tomorrow,
    )
    .sort(byTime)
  const batch = active.filter((t) => t.quadrant === 3)
  const recentlyDropped = archived.filter((t) => t.status === 'dropped').slice(0, 8)

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

        {/* 2번이 밀리는 게 이 앱이 풀려는 문제다. 못 본 척할 수 없어야 한다. */}
        {unscheduledPlan.length > 0 ? (
          <button
            type="button"
            onClick={revealUnscheduled}
            className="mt-4 flex w-full items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] px-3.5 py-3 text-[13px] text-warn"
          >
            <span>날짜 없는 일정</span>
            <b className="tabular-nums">{unscheduledPlan.length}</b>
            <span className="ml-auto">날짜 정하기 ↓</span>
          </button>
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
              <Link href="/guide" className="text-[13px] text-[var(--accent)] underline">
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

        {/* 오늘 / 내일 서브탭 */}
        <div className="mt-5 grid grid-cols-2 gap-2" role="tablist" aria-label="날짜 선택">
          <DayTabButton active={dayTab === 'today'} onClick={() => setDayTab('today')}>
            오늘 할 일
          </DayTabButton>
          <DayTabButton active={dayTab === 'tomorrow'} onClick={() => setDayTab('tomorrow')}>
            내일 할 일
          </DayTabButton>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-muted">불러오는 중</p>
        ) : (
          <>
            {dayTab === 'today' ? (
              <div className="mt-5 flex flex-col gap-6">
                <Section
                  quadrant={1}
                  label="지금 할 것"
                  tasks={queueNow}
                  empty="지금 할 것 없음."
                  onComplete={complete}
                  onDrop={drop}
                  onReschedule={reschedule}
                />
                <Section
                  quadrant={2}
                  label="예정된 일정"
                  tasks={dueToday}
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
                        style={{ background: quadrantColor(3) }}
                      />
                      3 · {QUADRANT_SPEC[3].verb}
                    </span>
                    <span className="tabular-nums">{batch.length}개 ⌄</span>
                  </summary>
                  <ul className="px-2 pb-2">
                    {batch.length === 0 ? (
                      <li className="px-1.5 py-3 text-sm text-muted">몰아서 처리할 것 없음.</li>
                    ) : (
                      batch.map((task) => (
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
            ) : (
              <div className="mt-5">
                <Section
                  quadrant={2}
                  label="내일로 잡아둔 일정"
                  tasks={dueTomorrow}
                  empty="내일로 잡아둔 것 없음."
                  onComplete={complete}
                  onDrop={drop}
                  onReschedule={reschedule}
                />
              </div>
            )}

            {/* 사분면 전체 — 세로 줄내림. 우선순위가 번호 순서대로 내려간다. */}
            <section id="quadrants" className="mt-9 border-t border-border pt-5 pb-8">
              <h2 className="text-[13px] font-medium text-muted">사분면 전체</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {BOARD_ORDER.map((q) => (
                  <QuadrantCell
                    key={q}
                    quadrant={q}
                    tasks={q === 4 ? recentlyDropped : active.filter((t) => t.quadrant === q)}
                    open={openQuadrants.has(q)}
                    onToggle={() => toggleQuadrant(q)}
                    onComplete={complete}
                    onDrop={drop}
                    onReschedule={reschedule}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Toast message={toast} />

      {/* 키보드가 올라오면 그만큼 밀어 올려 입력창이 항상 키보드 바로 위에 붙는다 */}
      <div
        className="shrink-0 bg-background"
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      >
        <p className="px-4 pt-2.5 text-[11px] font-medium tracking-wide text-muted">
          생각꺼내기
        </p>
        <CaptureBar onCapture={capture} />
        <AppNav inboxCount={inbox.length} />
      </div>
    </div>
  )
}

function DayTabButton({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-[46px] rounded-xl border text-sm transition-colors duration-150 ${
        active
          ? 'border-foreground font-medium text-foreground'
          : 'border-border text-muted'
      }`}
    >
      {children}
    </button>
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
  /** 홈은 상태 언어("지금 할 것", "예정된 일정"). 강제 동사는 분류 버튼의 것이다. */
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

/**
 * 사분면 전체 조망의 한 칸 — 드롭다운. 기본은 접혀서 개수만 보이고,
 * 탭하면 목록이 펼쳐진다 (사장님 지시 2026-08-03).
 * 4번은 최근 버린 것을 참고용으로만 보여준다.
 */
function QuadrantCell({
  quadrant,
  tasks,
  open,
  onToggle,
  onComplete,
  onDrop,
  onReschedule,
}: {
  quadrant: Quadrant
  tasks: Task[]
  open: boolean
  onToggle: () => void
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, start: string | null, end: string | null, time: string | null) => void
}) {
  const spec = QUADRANT_SPEC[quadrant]
  const color = quadrantColor(quadrant)
  const isDropCell = quadrant === 4
  const hasItems = tasks.length > 0

  return (
    <section
      style={{ borderColor: `color-mix(in srgb, ${color} 34%, transparent)` }}
      className="overflow-hidden rounded-xl border"
    >
      {/* 칸 제목은 강제 동사가 아니라 정의 그대로 (사장님 결정 2026-08-03) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-2 px-3.5 py-3 text-left"
      >
        <i className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: color }} />
        <span className="text-[13px] text-muted">
          {spec.id} · {spec.axis}
        </span>

        {/* 접힌 상태의 주인공은 개수다 — 크게, 칸 색으로 */}
        <span
          style={
            hasItems && !isDropCell
              ? {
                  color,
                  background: `color-mix(in srgb, ${color} 14%, transparent)`,
                }
              : undefined
          }
          className={`ml-auto min-w-[34px] rounded-lg px-2 py-1 text-center text-[15px] font-semibold tabular-nums ${
            hasItems && !isDropCell ? '' : 'text-muted'
          }`}
        >
          {tasks.length}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-xs text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {open ? (
        <div className="border-t border-border px-3 pb-3 pt-2">
          {tasks.length === 0 ? (
            <p className="py-1.5 text-[13px] text-muted">없음</p>
          ) : isDropCell ? (
            <ul className="flex flex-col gap-1.5 py-1">
              {tasks.map((task) => (
                <li key={task.id} className="text-[13px] leading-snug text-muted line-through">
                  {task.title}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="-mx-0.5">
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
        </div>
      ) : null}
    </section>
  )
}
