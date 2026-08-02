'use client'

import { useEffect, useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
import { QUADRANTS, QUADRANT_SPEC, quadrantColor, type Quadrant } from '@/lib/quadrant'
import { daysFromToday, isInbox, todayISO } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

/**
 * 분류. 인박스 전체를 리스트로 보여주고 선택된 항목만 하이라이트한다.
 * (사장님 요청 2026-08-02 — 원래는 "한 장씩" 카드였는데, 몇 개 쌓였는지도
 * 어떤 것부터 할지도 안 보여서 리스트로 바꿨다.)
 *
 * 하단 4버튼은 항상 "선택된 항목"에 작용한다. 기본 선택은 가장 오래된 것.
 */
export function ClassifyView() {
  const { tasks, loading, toast, classify } = useTasks()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [awaitingDate, setAwaitingDate] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 오래된 것부터. tasks는 최신순이라 뒤집는다.
  const queue = tasks.filter(isInbox).slice().reverse()
  const current = queue.find((t) => t.id === selectedId) ?? queue[0]

  // 다른 항목을 고르면 진행 중이던 날짜 단계는 버린다
  useEffect(() => {
    setAwaitingDate(false)
    setStartDate('')
    setEndDate('')
  }, [current?.id])

  function pick(quadrant: Quadrant) {
    if (!current) return
    // 3번은 일정에 넣는 것이 강제 동사다. 날짜 단계를 한 번 거치게 한다.
    if (quadrant === 3) {
      setAwaitingDate(true)
      return
    }
    advanceSelection()
    void classify(current.id, quadrant)
  }

  function commitThree(start: string | null, end: string | null = null) {
    if (!current) return
    advanceSelection()
    void classify(current.id, 3, start, end)
    setAwaitingDate(false)
    setStartDate('')
    setEndDate('')
  }

  /** 분류된 항목의 다음 것을 미리 선택해 둔다 — 위에서부터 착착 내려가는 흐름 */
  function advanceSelection() {
    if (!current) return
    const index = queue.findIndex((t) => t.id === current.id)
    setSelectedId(queue[index + 1]?.id ?? null)
  }

  return (
    <div className="app-shell flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">분류</h1>
          <span className="text-xs tabular-nums text-muted">남은 {queue.length}</span>
        </header>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : queue.length === 0 ? (
          <p className="mt-10 text-sm text-muted">인박스가 비었다.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-1.5 pb-4">
            {queue.map((task) => {
              const selected = task.id === current?.id
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm leading-snug transition-colors duration-150 ${
                      selected
                        ? 'border-[color-mix(in_srgb,var(--q3)_55%,transparent)] bg-[color-mix(in_srgb,var(--q3)_9%,transparent)] text-foreground'
                        : 'border-border text-muted'
                    }`}
                  >
                    {task.title}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {current && !loading ? (
        <div className="shrink-0 px-4 pb-2">
          {awaitingDate ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] text-muted">
                언제 할지 정한다 — <b className="text-foreground">{current.title}</b>
              </p>

              <div className="grid grid-cols-3 gap-2">
                <DateChip label="오늘" onClick={() => commitThree(todayISO())} />
                <DateChip label="내일" onClick={() => commitThree(daysFromToday(1))} />
                <DateChip label="일주일 뒤" onClick={() => commitThree(daysFromToday(7))} />
              </div>

              {/* 기간이면 끝 날짜까지, 하루면 시작만 넣고 지정 */}
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
                <button
                  type="button"
                  disabled={!startDate}
                  onClick={() => commitThree(startDate, endDate || null)}
                  className="min-h-[52px] shrink-0 rounded-xl border border-border px-5 text-sm disabled:opacity-40"
                >
                  지정
                </button>
              </div>

              {/* 건너뛰기를 허용한다. 대신 미배치로 남아 홈 경고 띠에 잡힌다. */}
              <button
                type="button"
                onClick={() => commitThree(null)}
                className="min-h-[48px] text-sm text-muted underline"
              >
                건너뛰기 (미배치로 남김)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
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
                    className="flex min-h-[88px] flex-col justify-between rounded-xl border p-3.5 text-left"
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
          )}
        </div>
      ) : null}

      <Toast message={toast} />
      <AppNav inboxCount={queue.length} />
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
