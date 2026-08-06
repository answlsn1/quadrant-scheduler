'use client'

import { useState } from 'react'

import { PickerField } from '@/components/picker-field'
import { quadrantColor, SCHEDULE_ON_CLASSIFY } from '@/lib/quadrant'
import { routineLabel, WEEKDAY_LABELS, type RoutineFreq } from '@/lib/routines'
import { useRoutines } from '@/lib/use-routines'

/**
 * 고정 일정(루틴) 관리 — 캘린더 하단의 직접 입구 (사장님 지시 2026-08-04).
 *
 * 그동안 루틴을 만들려면 생각을 먼저 적고 분류에서 2번을 골라야 했다.
 * 반복 업무는 "적을 생각"이 아니라 이미 정해진 것이라 그 경로가 어색했다.
 * 여기서는 제목부터 바로 쓴다.
 *
 * 한 번 만들면 해당 요일·일자에 일정이 전부 깔리고(매주 4주 / 매월 3개월,
 * 앱을 열 때마다 이어서 채워진다), 삭제하면 아직 안 한 것이 한 번에 지워진다.
 */
export function RoutineManager({ onChanged }: { onChanged?: () => void }) {
  const { routines, loading, busy, message, addRoutine, removeRoutine } = useRoutines()

  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [freq, setFreq] = useState<RoutineFreq>('weekly')
  const [days, setDays] = useState<Set<number>>(new Set())
  const [time, setTime] = useState('')
  /** 삭제는 두 번 눌러야 한다 — 한 번에 여러 일정이 사라지는 동작이다 */
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const accent = quadrantColor(SCHEDULE_ON_CLASSIFY)

  function resetForm() {
    setAdding(false)
    setTitle('')
    setFreq('weekly')
    setDays(new Set())
    setTime('')
  }

  /** 매주↔매월은 숫자의 뜻이 달라 재사용하면 안 된다 (매주 일요일 0 → 매월 0일) */
  function switchFreq(next: RoutineFreq) {
    setFreq(next)
    setDays(new Set())
  }

  function toggleDay(day: number) {
    setDays((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(day)) nextSet.delete(day)
      else nextSet.add(day)
      return nextSet
    })
  }

  async function submit() {
    const ok = await addRoutine(title, freq, [...days], time || null)
    if (ok) {
      resetForm()
      onChanged?.()
    }
  }

  return (
    <section className="mt-8 border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">고정 일정</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }}
            className="press min-h-[36px] rounded-full border px-3.5 text-xs font-medium"
          >
            + 루틴 추가
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        한 번 넣으면 해당 요일·날짜에 일정이 전부 깔린다. 지우면 아직 안 한 것이 한 번에 사라진다.
      </p>

      {adding ? (
        <div className="card-raise mt-3 rounded-xl p-3.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="무엇을 반복하나? (예: 새벽예배)"
            aria-label="고정 일정 제목"
            className="min-h-[48px] w-full rounded-lg border border-border bg-transparent px-3 outline-none placeholder:text-muted focus:border-[var(--accent)]"
          />

          <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => switchFreq('weekly')}
              aria-pressed={freq === 'weekly'}
              className={`min-h-[40px] rounded-md text-[13px] transition-colors duration-150 ${
                freq === 'weekly' ? 'bg-surface-hi font-semibold text-foreground' : 'text-muted'
              }`}
            >
              매주
            </button>
            <button
              type="button"
              onClick={() => switchFreq('monthly')}
              aria-pressed={freq === 'monthly'}
              className={`min-h-[40px] rounded-md text-[13px] transition-colors duration-150 ${
                freq === 'monthly' ? 'bg-surface-hi font-semibold text-foreground' : 'text-muted'
              }`}
            >
              매월
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-1.5">
            {(freq === 'weekly'
              ? WEEKDAY_LABELS.map((label, day) => ({ day, label }))
              : Array.from({ length: 31 }, (_, i) => ({ day: i + 1, label: String(i + 1) }))
            ).map(({ day, label }) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={days.has(day)}
                style={
                  days.has(day)
                    ? {
                        borderColor: accent,
                        background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                        color: accent,
                      }
                    : undefined
                }
                className={`rounded-lg border text-[13px] tabular-nums transition-colors duration-150 ${
                  freq === 'weekly' ? 'min-h-[44px]' : 'min-h-[38px]'
                } ${days.has(day) ? 'font-semibold' : 'border-border text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {freq === 'monthly' ? (
            <p className="mt-2 text-[11px] text-muted">
              29·30·31일은 그 날짜가 없는 달에는 건너뛴다.
            </p>
          ) : null}

          <div className="mt-2.5 flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted">시간 (선택)</span>
              <PickerField
                type="time"
                value={time}
                onChange={setTime}
                placeholder="시간 선택"
                ariaLabel="시간"
              />
            </label>
            <button
              type="button"
              disabled={busy || !title.trim() || days.size === 0}
              onClick={() => void submit()}
              style={{ background: accent }}
              className="press min-h-[48px] shrink-0 rounded-lg px-5 text-sm font-semibold text-background disabled:opacity-40"
            >
              {busy ? '만드는 중' : '만들기'}
            </button>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="mt-1.5 min-h-[40px] w-full text-[13px] text-muted underline"
          >
            취소
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-3 text-[13px] text-muted">불러오는 중</p>
      ) : routines.length === 0 ? (
        !adding ? <p className="mt-3 text-[13px] text-muted">아직 없다.</p> : null
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {routines.map((routine) => (
            <li
              key={routine.id}
              style={{ borderLeftColor: accent }}
              className="card-raise flex items-center gap-2 rounded-lg border-l-[3px] py-1 pl-3 pr-1"
            >
              <span className="min-w-0 flex-1 py-1.5">
                <span className="block truncate text-sm">{routine.title}</span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {routineLabel(routine)}
                </span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirmingId === routine.id) {
                    void removeRoutine(routine.id).then((ok) => {
                      if (ok) {
                        setConfirmingId(null)
                        onChanged?.()
                      }
                    })
                  } else {
                    setConfirmingId(routine.id)
                  }
                }}
                className={`min-h-[44px] shrink-0 rounded-lg px-3 text-xs transition-colors duration-150 disabled:opacity-50 ${
                  confirmingId === routine.id ? 'font-semibold text-[var(--q1)]' : 'text-muted'
                }`}
              >
                {confirmingId === routine.id ? '정말 삭제' : '삭제'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {message ? (
        <p role="status" className="mt-2.5 text-[12px] text-muted">
          {message}
        </p>
      ) : null}
    </section>
  )
}
