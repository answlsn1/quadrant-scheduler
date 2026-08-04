'use client'

import { useState } from 'react'

import {
  QUADRANTS,
  QUADRANT_SPEC,
  quadrantColor,
  SCHEDULE_ON_CLASSIFY,
  type Quadrant,
} from '@/lib/quadrant'
import {
  formatSchedule,
  formatTime,
  scheduleDeadline,
  todayISO,
  type Task,
} from '@/lib/tasks'

/** 완료 표시를 눈으로 보고 나서 목록에서 빠지게 하는 시간 */
const COMPLETE_ANIM_MS = 240

type Props = {
  task: Task
  onComplete: (id: string) => void
  onDrop: (id: string) => void
  onReschedule: (
    id: string,
    start: string | null,
    end: string | null,
    time: string | null,
  ) => void
  /** 다른 사분면으로 옮긴다 (사장님 지시 2026-08-04) */
  onMove?: (task: Task, quadrant: Quadrant) => void
}

/**
 * 항목을 탭하면 동작이 펼쳐진다.
 * 평소에는 제목만 보이고, 탭하면 글씨가 적힌 큰 버튼이 나온다.
 * 3번은 날짜를 기간(시작~끝)으로도 고칠 수 있다. 끝을 비우면 하루짜리다.
 */
export function TaskItem({ task, onComplete, onDrop, onReschedule, onMove }: Props) {
  const [open, setOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  /** 칸 옮기기를 펼쳤는지 — 한 단계 뒤에 둬서 오폭을 막는다 */
  const [movingOpen, setMovingOpen] = useState(false)

  const isSchedule = task.quadrant === SCHEDULE_ON_CLASSIFY
  const isNow = task.quadrant === 1
  const color = completing ? 'var(--accent)' : quadrantColor(task.quadrant)
  const schedule = formatSchedule(task)
  const deadline = scheduleDeadline(task)
  const overdue = Boolean(isSchedule && deadline && deadline < todayISO())

  function handleComplete() {
    if (completing) return
    setOpen(false)
    setMovingOpen(false)
    setCompleting(true)

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => onComplete(task.id), reduced ? 0 : COMPLETE_ANIM_MS)
  }

  function handleMove(quadrant: Quadrant) {
    setMovingOpen(false)
    setOpen(false)
    onMove?.(task, quadrant)
  }

  return (
    <li
      style={{ borderLeftColor: color }}
      className={`mb-1.5 overflow-hidden rounded-xl border-l-[3px] bg-surface transition-all duration-200 ${
        completing ? 'opacity-35' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug">{task.title}</span>
          {isSchedule ? (
            <span className="mt-1 block text-xs">
              {schedule ? (
                <span className={overdue ? 'text-warn' : 'text-muted'}>
                  {schedule}
                  {overdue ? ' · 지남' : ''}
                </span>
              ) : (
                <span className="text-warn">미배치</span>
              )}
            </span>
          ) : isNow && task.scheduled_time ? (
            /*
             * 1번은 오늘 할 것이라 날짜는 노이즈다. 시간만 보여준다.
             * 이 전제는 데이터 쪽에서 지킨다 — 1번의 날짜는 오늘 아니면 없다
             * (분류·칸 이동 모두 오늘로 맞춘다. use-tasks의 moveQuadrant 참고).
             */
            <span className="mt-1 block text-xs text-muted">
              {formatTime(task.scheduled_time)}
            </span>
          ) : null}
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
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-2.5">
          <button
            type="button"
            onClick={handleComplete}
            className="min-h-[48px] flex-1 rounded-lg border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-4 text-sm font-medium text-[var(--accent)]"
          >
            완료
          </button>
          <button
            type="button"
            onClick={() => onDrop(task.id)}
            className="min-h-[48px] flex-1 rounded-lg border border-border px-4 text-sm text-muted"
          >
            버린다
          </button>

          {isSchedule ? (
            <>
              <div className="flex w-full items-center gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] text-muted">시작</span>
                  <input
                    type="date"
                    value={task.scheduled_date ?? ''}
                    onChange={(e) => {
                      const start = e.target.value || null
                      // 시작을 지우면 끝·시간도 함께 비운다 (혼자 남을 수 없다).
                      // 시작을 끝보다 뒤로 미루면 끝을 비운다 — 그대로 보내면
                      // DB CHECK(끝 >= 시작)에 걸려 롤백 토스트만 뜬다. (리뷰 발견)
                      const end =
                        start && task.scheduled_end_date && task.scheduled_end_date >= start
                          ? task.scheduled_end_date
                          : null
                      onReschedule(task.id, start, end, start ? task.scheduled_time : null)
                    }}
                    aria-label="시작 날짜"
                    className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 text-sm"
                  />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] text-muted">끝 (기간일 때만)</span>
                  <input
                    type="date"
                    value={task.scheduled_end_date ?? ''}
                    min={task.scheduled_date ?? undefined}
                    disabled={!task.scheduled_date}
                    onChange={(e) =>
                      onReschedule(
                        task.id,
                        task.scheduled_date,
                        e.target.value || null,
                        task.scheduled_time,
                      )
                    }
                    aria-label="끝 날짜"
                    className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 text-sm disabled:opacity-40"
                  />
                </label>
              </div>
              <label className="flex w-full flex-col gap-1">
                <span className="text-[11px] text-muted">시간 (선택)</span>
                <input
                  type="time"
                  value={task.scheduled_time ? task.scheduled_time.slice(0, 5) : ''}
                  disabled={!task.scheduled_date}
                  onChange={(e) =>
                    onReschedule(
                      task.id,
                      task.scheduled_date,
                      task.scheduled_end_date,
                      e.target.value || null,
                    )
                  }
                  aria-label="시간"
                  className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 text-sm disabled:opacity-40"
                />
              </label>
            </>
          ) : isNow ? (
            <>
              <label className="flex w-full flex-col gap-1">
                <span className="text-[11px] text-muted">실행 시간 (선택)</span>
                <input
                  type="time"
                  value={task.scheduled_time ? task.scheduled_time.slice(0, 5) : ''}
                  onChange={(e) =>
                    // 시간을 정하면 날짜도 오늘로 같이 (시간은 날짜 없이 못 산다)
                    onReschedule(
                      task.id,
                      e.target.value ? (task.scheduled_date ?? todayISO()) : task.scheduled_date,
                      task.scheduled_end_date,
                      e.target.value || null,
                    )
                  }
                  aria-label="실행 시간"
                  className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 text-sm"
                />
              </label>
            </>
          ) : null}

          {/*
            칸 옮기기 (사장님 지시 2026-08-04).
            분류를 잘못했다는 걸 나중에 깨닫는 일이 많은데, 지금까지는 되돌릴
            통로가 없었다. 한 단계 뒤에 둬서 자주 쓰는 완료·버림과 섞이지 않게 한다.
          */}
          {onMove ? (
            movingOpen ? (
              <div className="w-full">
                <p className="mb-1.5 text-[11px] text-muted">어느 칸으로 옮길까?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUADRANTS.filter((q) => q !== task.quadrant).map((q) => {
                    const spec = QUADRANT_SPEC[q]
                    const target = quadrantColor(q)
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleMove(q)}
                        style={{
                          borderColor: `color-mix(in srgb, ${target} 40%, transparent)`,
                          background: `color-mix(in srgb, ${target} 10%, transparent)`,
                        }}
                        className="flex min-h-[52px] flex-col justify-center gap-0.5 rounded-lg border px-3 text-left"
                      >
                        <span className="text-[10px] text-muted">
                          {spec.id} · {spec.axis}
                        </span>
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: q === 4 ? 'var(--muted)' : target }}
                        >
                          {spec.verb}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setMovingOpen(false)}
                  className="mt-1.5 min-h-[44px] w-full text-[13px] text-muted underline"
                >
                  돌아가기
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMovingOpen(true)}
                className="min-h-[44px] w-full rounded-lg border border-dashed border-border text-[13px] text-muted"
              >
                다른 칸으로 옮기기
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
