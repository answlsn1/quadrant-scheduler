'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { TaskItem } from '@/components/task-item'
import { Toast } from '@/components/toast'
import { quadrantColor } from '@/lib/quadrant'
import { WEEKDAY_LABELS } from '@/lib/routines'
import { formatDate, isActive, scheduleDeadline, todayISO, type Task } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

/**
 * 캘린더 (사장님 지시 2026-08-03 — 구글캘린더식 월 그리드).
 * 날짜가 등록된 활성 항목을 달력에 점으로 깔고, 날을 탭하면
 * 그날의 일정이 시간순으로 아래에 뜬다. 기간 일정은 걸친 모든 날에 보인다.
 */
export function CalendarView() {
  const { tasks, loading, toast, complete, drop, reschedule, moveQuadrant } = useTasks()

  const today = todayISO()
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() } // month 0-based
  })
  const [selectedDay, setSelectedDay] = useState(today)

  const scheduled = tasks.filter((t) => isActive(t) && t.scheduled_date)

  /** 해당 날짜에 걸치는 항목 (기간이면 시작~끝 사이 전부) */
  function itemsOn(iso: string): Task[] {
    return scheduled
      .filter((t) => t.scheduled_date! <= iso && (scheduleDeadline(t) ?? '') >= iso)
      .sort((a, b) => (a.scheduled_time ?? '99').localeCompare(b.scheduled_time ?? '99'))
  }

  const firstDay = new Date(anchor.year, anchor.month, 1)
  const daysInMonth = new Date(anchor.year, anchor.month + 1, 0).getDate()
  const leadingBlanks = firstDay.getDay() // 일요일 시작

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, '0')
      const m = String(anchor.month + 1).padStart(2, '0')
      return `${anchor.year}-${m}-${d}`
    }),
  ]

  function moveMonth(delta: number) {
    setAnchor((prev) => {
      const moved = new Date(prev.year, prev.month + delta, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  function jumpToday() {
    const now = new Date()
    setAnchor({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDay(today)
  }

  const selectedItems = itemsOn(selectedDay)

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">캘린더</h1>
          <button
            type="button"
            onClick={jumpToday}
            className="min-h-[36px] rounded-full border border-border px-3 text-xs text-muted"
          >
            오늘
          </button>
        </header>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted"
          >
            ‹
          </button>
          <p className="text-[15px] font-medium tabular-nums">
            {anchor.year}년 {anchor.month + 1}월
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted"
          >
            ›
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-muted">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="py-1.5">
              {label}
            </span>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-muted">불러오는 중</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, index) =>
                iso === null ? (
                  <span key={`blank-${index}`} />
                ) : (
                  <DayCell
                    key={iso}
                    iso={iso}
                    isToday={iso === today}
                    selected={iso === selectedDay}
                    items={itemsOn(iso)}
                    onSelect={() => setSelectedDay(iso)}
                  />
                ),
              )}
            </div>

            <section className="mt-6 border-t border-border pt-4 pb-6">
              <h2 className="text-[13px] text-muted">{formatDate(selectedDay)}</h2>
              {selectedItems.length === 0 ? (
                <p className="mt-2 text-sm text-muted">이날 일정 없음.</p>
              ) : (
                <ul className="mt-2">
                  {selectedItems.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={complete}
                      onDrop={drop}
                      onReschedule={reschedule}
                      onMove={moveQuadrant}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <Toast message={toast} />
      <AppNav />
    </div>
  )
}

function DayCell({
  iso,
  isToday,
  selected,
  items,
  onSelect,
}: {
  iso: string
  isToday: boolean
  selected: boolean
  items: Task[]
  onSelect: () => void
}) {
  const day = Number(iso.slice(8, 10))

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${day}일, 일정 ${items.length}건`}
      aria-pressed={selected}
      className={`flex min-h-[52px] flex-col items-center gap-1 rounded-lg border pt-1.5 transition-colors duration-150 ${
        selected
          ? 'border-[var(--accent)]'
          : isToday
            ? 'border-[color-mix(in_srgb,var(--accent)_40%,transparent)]'
            : 'border-transparent'
      }`}
    >
      <span
        className={`text-[13px] tabular-nums ${
          isToday ? 'font-semibold text-[var(--accent)]' : 'text-foreground'
        }`}
      >
        {day}
      </span>
      <span className="flex h-[6px] items-center gap-0.5">
        {items.slice(0, 3).map((t) => (
          <i
            key={t.id}
            className="h-[5px] w-[5px] rounded-full"
            style={{ background: quadrantColor(t.quadrant) }}
          />
        ))}
        {items.length > 3 ? <span className="text-[8px] leading-none text-muted">+</span> : null}
      </span>
    </button>
  )
}
