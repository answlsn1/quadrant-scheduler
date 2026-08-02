'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
import { QUADRANTS, QUADRANT_SPEC, quadrantColor, type Quadrant } from '@/lib/quadrant'
import { daysFromToday, isInbox, todayISO } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

/**
 * 인박스를 한 장씩 넘기며 사분면을 지정한다.
 * 버튼을 하단에 크게 깔았다 — 원핸드 기준 엄지 반경 안이다. (3단계 시안 확정)
 */
export function ClassifyView() {
  const { tasks, loading, toast, classify } = useTasks()
  const [awaitingDate, setAwaitingDate] = useState(false)
  const [customDate, setCustomDate] = useState('')

  // 오래된 것부터 처리한다. tasks는 최신순이라 뒤집는다.
  const queue = tasks.filter(isInbox).slice().reverse()
  const current = queue[0]

  function pick(quadrant: Quadrant) {
    if (!current) return
    // 3번은 날짜를 박는 것이 강제 동사다. 지정 단계를 한 번 거치게 한다.
    if (quadrant === 3) {
      setAwaitingDate(true)
      return
    }
    void classify(current.id, quadrant)
  }

  function commitThree(date: string | null) {
    if (!current) return
    void classify(current.id, 3, date)
    setAwaitingDate(false)
    setCustomDate('')
  }

  return (
    <div className="app-shell flex flex-col">
      <main className="flex flex-1 flex-col overflow-y-auto px-4 pt-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">분류</h1>
          <span className="text-xs tabular-nums text-muted">남은 {queue.length}</span>
        </header>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : !current ? (
          <p className="mt-10 text-sm text-muted">인박스가 비었다.</p>
        ) : (
          <p className="mb-auto mt-8 text-[21px] font-medium leading-snug tracking-tight">
            {current.title}
          </p>
        )}
      </main>

      {current && !loading ? (
        <div className="shrink-0 px-4 pb-2">
          {awaitingDate ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] text-muted">언제 할지 박는다</p>

              <div className="grid grid-cols-3 gap-2">
                <DateChip label="오늘" onClick={() => commitThree(todayISO())} />
                <DateChip label="내일" onClick={() => commitThree(daysFromToday(1))} />
                <DateChip label="일주일 뒤" onClick={() => commitThree(daysFromToday(7))} />
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  aria-label="직접 날짜 선택"
                  className="min-h-[52px] flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm"
                />
                <button
                  type="button"
                  disabled={!customDate}
                  onClick={() => commitThree(customDate)}
                  className="min-h-[52px] rounded-xl border border-border px-5 text-sm disabled:opacity-40"
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
