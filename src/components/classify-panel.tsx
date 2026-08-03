'use client'

import { useEffect, useState } from 'react'

import {
  QUADRANTS,
  QUADRANT_SPEC,
  quadrantColor,
  SCHEDULE_ON_CLASSIFY,
  type Quadrant,
} from '@/lib/quadrant'
import { daysFromToday, todayISO, type Task } from '@/lib/tasks'

type Props = {
  task: Task
  /** 이 항목 뒤에 더 남은 인박스 개수 (0이면 표시 안 함) */
  remaining: number
  onClassify: (
    quadrant: Quadrant,
    start?: string | null,
    end?: string | null,
    time?: string | null,
  ) => void
  /** 분류하지 않고 인박스에 남긴 채 넘어간다 */
  onSkip: () => void
  onClose: () => void
}

/**
 * 홈 하단에 뜨는 분류 패널 (2026-08-03 사장님 결정 — 분류 탭 제거).
 * 캡처 직후에는 방금 적은 항목으로, 인박스 버튼으로 열면 쌓인 것부터 순서대로.
 *
 * 후속 단계 루틴은 분류 탭 시절 그대로다:
 *  1번 → "실행 시간은?" (시간만, 날짜는 자동으로 오늘)
 *  2번 → "언제 할지 정한다" (날짜·기간·시간)
 */
export function ClassifyPanel({ task, remaining, onClassify, onSkip, onClose }: Props) {
  const [pendingStep, setPendingStep] = useState<1 | 2 | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')

  // 다른 항목으로 넘어가면 진행 중이던 후속 단계는 버린다
  useEffect(() => {
    setPendingStep(null)
    setStartDate('')
    setEndDate('')
    setStartTime('')
  }, [task.id])

  function pick(quadrant: Quadrant) {
    if (quadrant === 1) {
      setPendingStep(1)
      return
    }
    if (quadrant === SCHEDULE_ON_CLASSIFY) {
      setPendingStep(2)
      return
    }
    onClassify(quadrant)
  }

  return (
    <div className="border-t border-border px-4 pb-2 pt-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[13px] text-muted">
          어느 칸에 넣을까? —{' '}
          <b className="text-foreground">{task.title}</b>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {remaining > 0 ? (
            <span className="text-[11px] tabular-nums text-muted">남은 {remaining}</span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="분류 닫기"
            className="flex h-9 w-9 items-center justify-center text-muted"
          >
            ✕
          </button>
        </div>
      </div>

      {pendingStep === 1 ? (
        <div className="mt-2.5 flex flex-col gap-2.5">
          <p className="text-[13px] text-muted">실행 시간은?</p>
          <div className="flex items-end gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-label="실행 시간"
              className="min-h-[52px] min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
            />
            <button
              type="button"
              disabled={!startTime}
              onClick={() => onClassify(1, todayISO(), null, startTime)}
              className="min-h-[52px] shrink-0 rounded-xl border border-border px-5 text-sm disabled:opacity-40"
            >
              지정
            </button>
          </div>
          <button
            type="button"
            onClick={() => onClassify(1, null, null, null)}
            className="min-h-[48px] text-sm text-muted underline"
          >
            시간 없이 넣기
          </button>
        </div>
      ) : pendingStep === 2 ? (
        <div className="mt-2.5 flex flex-col gap-2.5">
          <p className="text-[13px] text-muted">언제 할지 정한다</p>

          <div className="grid grid-cols-3 gap-2">
            <DateChip
              label="오늘"
              onClick={() => onClassify(SCHEDULE_ON_CLASSIFY, todayISO())}
            />
            <DateChip
              label="내일"
              onClick={() => onClassify(SCHEDULE_ON_CLASSIFY, daysFromToday(1))}
            />
            <DateChip
              label="일주일 뒤"
              onClick={() => onClassify(SCHEDULE_ON_CLASSIFY, daysFromToday(7))}
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted">시작</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value && endDate < e.target.value) setEndDate('')
                }}
                aria-label="시작 날짜"
                className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-3 text-sm"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted">끝 (기간일 때만)</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={!startDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="끝 날짜"
                className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-3 text-sm disabled:opacity-40"
              />
            </label>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted">시간 (선택)</span>
              <input
                type="time"
                value={startTime}
                disabled={!startDate}
                onChange={(e) => setStartTime(e.target.value)}
                aria-label="시간"
                className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-3 text-sm disabled:opacity-40"
              />
            </label>
            <button
              type="button"
              disabled={!startDate}
              onClick={() =>
                onClassify(SCHEDULE_ON_CLASSIFY, startDate, endDate || null, startTime || null)
              }
              className="min-h-[52px] shrink-0 rounded-xl border border-border px-5 text-sm disabled:opacity-40"
            >
              지정
            </button>
          </div>

          <button
            type="button"
            onClick={() => onClassify(SCHEDULE_ON_CLASSIFY, null)}
            className="min-h-[48px] text-sm text-muted underline"
          >
            건너뛰기 (미배치로 남김)
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {QUADRANTS.map((q) => {
              const spec = QUADRANT_SPEC[q]
              const color = quadrantColor(q)
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => pick(q)}
                  style={{
                    background: `color-mix(in srgb, ${color} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                  }}
                  className="flex min-h-[84px] flex-col justify-between rounded-xl border p-3.5 text-left"
                >
                  <span className="text-[11px] text-muted">
                    {spec.id} · {spec.axis}
                  </span>
                  <span
                    className="text-[15px] font-semibold"
                    style={{ color: q === 4 ? 'var(--muted)' : color }}
                  >
                    {spec.verb}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 min-h-[44px] w-full text-sm text-muted underline"
          >
            나중에 (인박스에 둔다)
          </button>
        </>
      )}
    </div>
  )
}

function DateChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[52px] rounded-xl border border-border bg-surface text-sm"
    >
      {label}
    </button>
  )
}
