'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AccountMenu } from '@/components/account-menu'
import { AppNav } from '@/components/app-nav'
import { CaptureBar } from '@/components/capture-bar'
import { ClassifyPanel } from '@/components/classify-panel'
import { QuadrantBadge } from '@/components/quadrant-badge'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import {
  BOARD_ORDER,
  QUADRANT_SPEC,
  isQuadrant,
  quadrantColor,
  type Quadrant,
} from '@/lib/quadrant'
import {
  daysFromToday,
  formatDateLong,
  isActive,
  isInbox,
  isUnscheduledPlan,
  scheduleDeadline,
  todayISO,
  type Task,
} from '@/lib/tasks'
import type { RoutineFreq } from '@/lib/routines'
import { useArchive } from '@/lib/use-archive'
import { useKeyboardInset } from '@/lib/use-keyboard-inset'
import { useTasks } from '@/lib/use-tasks'

/** 처음 안내 카드를 한 번 닫으면 다시 보여주지 않기 위한 로컬 플래그 */
const INTRO_SEEN_KEY = 'sabun.intro.seen'
/** 사분면 전체에서 마지막으로 열어둔 칸들 */
const QUADRANT_OPEN_KEY = 'sabun.quadrants.open'

type DayTab = 'today' | 'tomorrow'

/**
 * 통합 홈 (2026-08-03 사장님 결정 — 스케줄러 탭을 여기로 합쳤다).
 *
 * 위: [오늘 할 일 | 내일 할 일] 서브탭 — 그날 할 것만.
 * 아래: 사분면 전체 — 모바일에서 2×2를 억지로 유지하지 않고 세로로 줄내림.
 * 이 앱의 중심은 "간편하게 적고, 간편하게 확인"이다.
 */
export function HomeView() {
  const {
    tasks,
    loading,
    toast,
    capture,
    classify,
    createRoutine,
    moveQuadrant,
    complete,
    undoTarget,
    undoComplete,
    drop,
    reschedule,
  } = useTasks()
  // 4번 칸의 "최근 버린 것" 표시용. 버린 항목은 작업 목록에 없다.
  const { items: archived } = useArchive()
  const keyboardInset = useKeyboardInset()

  const [dayTab, setDayTab] = useState<DayTab>('today')

  /*
   * 인라인 분류 (2026-08-03 사장님 결정 — 분류 탭 제거, 홈에서 전부).
   *  - 'capture': 방금 적은 항목 하나만 묻고 닫는다. 연속 캡처 흐름을 지킨다.
   *  - 'inbox'  : 인박스 버튼으로 열어 쌓인 것을 오래된 순으로 처리한다.
   * 캡처 저장은 패널과 무관하게 먼저 끝나 있다 — 5초 룰은 그대로다.
   */
  const [classifyMode, setClassifyMode] = useState<'capture' | 'inbox' | null>(null)
  const [classifyFocusId, setClassifyFocusId] = useState<string | null>(null)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())

  /*
   * 사분면 전체는 기본 접힘 — 개수만 보인다 (사장님 지시 2026-08-03).
   * 펼침 상태는 세션 안에서만 유지한다. details 대신 상태로 관리하는 이유는
   * 위의 "날짜 없는 일정" 띠를 눌렀을 때 2번 칸을 코드로 펼쳐야 하기 때문.
   */
  const [openQuadrants, setOpenQuadrants] = useState<Set<Quadrant>>(new Set())

  // 마지막으로 열어둔 칸을 기억한다 (사장님 결정 2026-08-03).
  // SSR에는 localStorage가 없으므로 접힌 채로 시작해 마운트 후 복원한다.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUADRANT_OPEN_KEY)
      if (raw) {
        const saved = (JSON.parse(raw) as (number | null)[]).filter(isQuadrant)
        if (saved.length > 0) setOpenQuadrants(new Set(saved))
      }
    } catch {
      // 저장값이 깨졌으면 접힌 기본값으로 간다
    }
  }, [])

  function persistOpen(next: Set<Quadrant>) {
    localStorage.setItem(QUADRANT_OPEN_KEY, JSON.stringify([...next]))
  }

  function toggleQuadrant(q: Quadrant) {
    setOpenQuadrants((prev) => {
      const next = new Set(prev)
      if (next.has(q)) next.delete(q)
      else next.add(q)
      persistOpen(next)
      return next
    })
  }
  function revealUnscheduled() {
    setOpenQuadrants((prev) => {
      const next = new Set(prev).add(2 as Quadrant)
      persistOpen(next)
      return next
    })
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

  // 1번도 시간을 가질 수 있으니 시간순으로 (시간 없는 것은 뒤로)
  const queueNow = active.filter((t) => t.quadrant === 1).sort(byTime)
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
  /** 사분면 전체 2번 칸에서 뺀 루틴 발생 수 — 캘린더 안내에 쓴다 */
  const routineOccurrenceCount = active.filter(
    (t) => t.quadrant === 2 && t.routine_id,
  ).length

  // 분류 대상: 오래된 것부터, 이번 세션에서 "나중에"한 것은 건너뛴다
  const classifyQueue = inbox
    .slice()
    .reverse()
    .filter((t) => !skippedIds.has(t.id))
  const classifyTask = classifyMode
    ? (classifyQueue.find((t) => t.id === classifyFocusId) ?? classifyQueue[0] ?? null)
    : null

  // 처리할 것이 다 떨어지면 패널을 닫고 캡처로 돌아간다
  useEffect(() => {
    if (classifyMode && !classifyTask) closeClassify()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- classifyTask 소멸 시점만 본다
  }, [classifyMode, classifyTask?.id])

  function closeClassify() {
    setClassifyMode(null)
    setClassifyFocusId(null)
    setSkippedIds(new Set())
  }

  async function handleCapture(title: string) {
    const newId = await capture(title)
    if (newId) {
      // 방금 적은 것을 바로 분류하게 패널을 연다. 저장은 이미 끝났다.
      setSkippedIds(new Set())
      setClassifyFocusId(newId)
      setClassifyMode('capture')
    }
    return newId
  }

  function handleClassify(
    quadrant: Quadrant,
    start?: string | null,
    end?: string | null,
    time?: string | null,
  ) {
    if (!classifyTask) return
    void classify(classifyTask.id, quadrant, start ?? null, end ?? null, time ?? null)
    if (classifyMode === 'capture') closeClassify() // 연속 캡처 흐름으로 복귀
    else setClassifyFocusId(null) // 다음 항목으로
  }

  function handleRoutine(freq: RoutineFreq, days: number[], time: string | null) {
    if (!classifyTask) return
    void createRoutine(classifyTask, freq, days, time)
    if (classifyMode === 'capture') {
      closeClassify()
      return
    }
    /*
     * 인박스 모드: createRoutine은 첫 왕복이 끝나야 항목이 인박스에서 빠지므로
     * (classify와 달리 즉시 낙관적 반영이 없다), 완료를 기다리지 않고
     * 세션 스킵으로 바로 다음 항목으로 넘긴다 (리뷰 발견: 이중 탭 중복 방지).
     * 실패하면 토스트가 뜨고 항목은 인박스에 남는다.
     */
    setSkippedIds((prev) => new Set(prev).add(classifyTask.id))
    setClassifyFocusId(null)
  }

  function handleClassifySkip() {
    if (!classifyTask) return
    if (classifyMode === 'capture') {
      closeClassify()
      return
    }
    setSkippedIds((prev) => new Set(prev).add(classifyTask.id))
    setClassifyFocusId(null)
  }

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* 이 화면의 주어는 "오늘"이다. 며칠인지를 앱이 먼저 말해준다. */}
            <p className="text-[11px] tracking-[0.04em] text-muted">{formatDateLong(today)}</p>
            <h1 className="mt-0.5 text-[25px] font-bold leading-[1.05] tracking-[-0.03em]">
              오늘의 일정
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* 분류 탭이 없어졌으므로 쌓인 인박스는 여기서 몰아서 분류한다.
                처리할 게 있으면 채워서 눈에 걸리게, 0이면 조용히 가라앉힌다. */}
            <button
              type="button"
              disabled={inbox.length === 0}
              onClick={() => {
                setSkippedIds(new Set())
                setClassifyFocusId(null)
                setClassifyMode('inbox')
              }}
              className={`press min-h-[34px] rounded-full px-3 text-xs font-medium tabular-nums transition-colors duration-150 ${
                inbox.length > 0
                  ? 'bg-[var(--accent)] text-background'
                  : 'border border-border text-muted'
              }`}
            >
              인박스 {inbox.length}
            </button>
            <AccountMenu />
          </div>
        </header>

        {/* 2번이 밀리는 게 이 앱이 풀려는 문제다. 못 본 척할 수 없어야 한다. */}
        {unscheduledPlan.length > 0 ? (
          <button
            type="button"
            onClick={revealUnscheduled}
            style={{ borderLeftWidth: 3, borderLeftColor: 'var(--warn)' }}
            className="press mt-4 flex w-full items-center gap-2 rounded-lg rounded-r-xl border border-[color-mix(in_srgb,var(--warn)_26%,transparent)] bg-[color-mix(in_srgb,var(--warn)_13%,transparent)] px-3.5 py-3 text-[13px] text-warn"
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
                <b className="text-foreground">1</b> 아래 입력창에 떠오르는 것을 그냥 적는다
              </li>
              <li>
                <b className="text-foreground">2</b> 적자마자 네 칸 중 하나로 나눈다 — 바쁘면
                "나중에"로 넘겨도 된다
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

        {/* 오늘 / 내일 서브탭 — 선택된 칸이 실제로 떠오르는 세그먼트 컨트롤 */}
        <div
          className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1"
          role="tablist"
          aria-label="날짜 선택"
        >
          <DayTabButton
            active={dayTab === 'today'}
            count={queueNow.length + dueToday.length}
            onClick={() => setDayTab('today')}
          >
            오늘 할 일
          </DayTabButton>
          <DayTabButton
            active={dayTab === 'tomorrow'}
            count={dueTomorrow.length}
            onClick={() => setDayTab('tomorrow')}
          >
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
                  label="오늘 할 것"
                  tasks={queueNow}
                  empty="오늘 할 것 없음."
                  onComplete={complete}
                  onDrop={drop}
                  onReschedule={reschedule}
                  onMove={moveQuadrant}
                />
                <Section
                  quadrant={2}
                  label="예정된 일정"
                  tasks={dueToday}
                  empty="오늘 일정에 넣어둔 것 없음."
                  onComplete={complete}
                  onDrop={drop}
                  onReschedule={reschedule}
                  onMove={moveQuadrant}
                />
                <details className="rounded-xl border border-dashed border-border">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-[13px] text-muted">
                    <QuadrantBadge quadrant={3} />
                    <span className="font-medium">{QUADRANT_SPEC[3].verb}</span>
                    <span className="ml-auto tabular-nums">{batch.length}개 ⌄</span>
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
                          onMove={moveQuadrant}
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
                  onMove={moveQuadrant}
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
                    /*
                     * 2번 칸에서 루틴 발생은 뺀다 (사장님 피드백 2026-08-06).
                     * 매주·매월 발생이 수십 건씩 쌓여 정작 낱개 일정이 묻힌다.
                     * 루틴은 캘린더 탭이 규칙 단위로 보여주는 곳이다.
                     * 오늘 할 일·알림에는 그대로 남는다 — 실행 목록이니까.
                     */
                    tasks={
                      q === 4
                        ? recentlyDropped
                        : active.filter(
                            (t) => t.quadrant === q && !(q === 2 && t.routine_id),
                          )
                    }
                    footnote={
                      q === 2 && routineOccurrenceCount > 0
                        ? `고정 일정 ${routineOccurrenceCount}건은 캘린더에서`
                        : undefined
                    }
                    extraCount={q === 2 ? routineOccurrenceCount : 0}
                    open={openQuadrants.has(q)}
                    onToggle={() => toggleQuadrant(q)}
                    onComplete={complete}
                    onDrop={drop}
                    onReschedule={reschedule}
                    onMove={moveQuadrant}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* 오류가 우선. 없을 때만 실행취소 창구를 보여준다. */}
      {toast ? (
        <Toast message={toast} />
      ) : undoTarget ? (
        <Toast
          tone="info"
          message={`완료 — ${undoTarget.title}`}
          action={{ label: '실행취소', onClick: () => void undoComplete() }}
        />
      ) : null}

      {/* 키보드가 올라오면 그만큼 밀어 올려 입력창이 항상 키보드 바로 위에 붙는다 */}
      <div
        className="shrink-0 bg-background"
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      >
        {classifyTask ? (
          /* 캡처 직후(또는 인박스 버튼)에는 생각꺼내기 자리에 분류가 뜬다 */
          <ClassifyPanel
            task={classifyTask}
            remaining={Math.max(0, classifyQueue.length - 1)}
            onClassify={handleClassify}
            onRoutine={handleRoutine}
            onSkip={handleClassifySkip}
            onClose={closeClassify}
          />
        ) : (
          <>
            {/* 이 앱의 심장이다. 늘 "여기 쓰라"고 말하고 있어야 한다. */}
            <p className="px-4 pt-2.5 text-[10.5px] font-semibold tracking-[0.05em] text-[var(--accent)]">
              생각꺼내기
            </p>
            <CaptureBar onCapture={handleCapture} />
          </>
        )}
        <AppNav />
      </div>
    </div>
  )
}

function DayTabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  /** 그 날의 할 일 개수. 눌러보기 전에 보이라고 탭에 붙인다. */
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg text-sm transition-colors duration-150 ${
        active
          ? 'bg-surface-hi font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.4)]'
          : 'text-muted'
      }`}
    >
      {children}
      {count > 0 ? (
        <span
          className={`min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums ${
            active
              ? 'bg-[var(--q1)] text-background'
              : 'bg-[color-mix(in_srgb,var(--muted)_22%,transparent)] text-muted'
          }`}
        >
          {count}
        </span>
      ) : null}
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
  onMove,
}: {
  quadrant: Quadrant
  /** 홈은 상태 언어("오늘 할 것", "예정된 일정"). 강제 동사는 분류 버튼의 것이다. */
  label: string
  tasks: Task[]
  empty: string
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, start: string | null, end: string | null, time: string | null) => void
  onMove: (task: Task, quadrant: Quadrant) => void
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2">
        <QuadrantBadge quadrant={quadrant} solid />
        <span className="text-[13px] font-semibold tracking-[-0.01em]">{label}</span>
        {tasks.length > 0 ? (
          <span className="ml-auto text-[11.5px] tabular-nums text-muted">{tasks.length}</span>
        ) : null}
      </h2>
      <ul className="mt-2.5">
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
              onMove={onMove}
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
  footnote,
  extraCount = 0,
  open,
  onToggle,
  onComplete,
  onDrop,
  onReschedule,
  onMove,
}: {
  quadrant: Quadrant
  tasks: Task[]
  /** 이 칸에서 일부러 뺀 것이 있을 때의 안내 (예: 루틴은 캘린더에서) */
  footnote?: string
  /**
   * 목록에서 뺐지만 존재는 알려야 하는 개수 (루틴 발생).
   * 낱개 0 + 루틴 52건일 때 접힌 뱃지가 "0"이면 비어 보인다 (리뷰 발견).
   */
  extraCount?: number
  open: boolean
  onToggle: () => void
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (id: string, start: string | null, end: string | null, time: string | null) => void
  onMove: (task: Task, quadrant: Quadrant) => void
}) {
  const spec = QUADRANT_SPEC[quadrant]
  const color = quadrantColor(quadrant)
  const isDropCell = quadrant === 4
  const hasItems = tasks.length > 0

  return (
    <section
      style={{
        borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        background: `linear-gradient(180deg, var(--surface), transparent)`,
      }}
      className="overflow-hidden rounded-xl border"
    >
      {/* 칸 제목은 강제 동사가 아니라 정의 그대로 (사장님 결정 2026-08-03) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="press flex min-h-[52px] w-full items-center gap-2.5 px-3 py-3 text-left"
      >
        <QuadrantBadge quadrant={quadrant} />
        <span className="text-[12.5px] text-muted">{spec.axis}</span>

        {/* 접힌 상태의 주인공은 개수다 — 채워서, 칸 색으로 */}
        {extraCount > 0 ? (
          <span className="ml-auto text-[11px] tabular-nums text-muted">
            +고정 {extraCount}
          </span>
        ) : null}
        <span
          style={
            hasItems && !isDropCell
              ? { background: color, color: 'var(--background)' }
              : undefined
          }
          className={`min-w-[32px] rounded-lg px-2 py-1 text-center text-[15px] font-bold tabular-nums ${
            hasItems && !isDropCell ? '' : 'text-muted'
          } ${extraCount > 0 ? '' : 'ml-auto'}`}
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
                  onMove={onMove}
                />
              ))}
            </ul>
          )}
          {footnote ? (
            <Link
              href="/calendar"
              className="mt-1 flex min-h-[40px] items-center text-[12px] text-muted underline"
            >
              {footnote} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
