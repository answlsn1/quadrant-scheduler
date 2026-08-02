'use client'

import { useState } from 'react'

import { AppNav } from '@/components/app-nav'
import { Toast } from '@/components/toast'
import { QUADRANTS, QUADRANT_SPEC, type Quadrant } from '@/lib/quadrant'
import { daysFromToday, isInbox, todayISO } from '@/lib/tasks'
import { useTasks } from '@/lib/use-tasks'

/**
 * 인박스를 한 장씩 넘기며 사분면을 지정한다.
 * 캡처와 분류를 분리한다는 원칙 1의 후반부에 해당하는 화면이다.
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
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 flex-col px-5 pt-8">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-medium">분류</h1>
          <span className="text-xs text-muted">남은 {queue.length}</span>
        </header>

        {loading ? (
          <p className="mt-10 text-sm text-muted">불러오는 중</p>
        ) : !current ? (
          <p className="mt-10 text-sm text-muted">인박스가 비었다.</p>
        ) : (
          <>
            <p className="mt-10 text-lg leading-snug">{current.title}</p>

            {awaitingDate ? (
              <div className="mt-10">
                <p className="text-sm text-muted">언제 할지 박는다</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DateChip label="오늘" onClick={() => commitThree(todayISO())} />
                  <DateChip label="내일" onClick={() => commitThree(daysFromToday(1))} />
                  <DateChip label="일주일 뒤" onClick={() => commitThree(daysFromToday(7))} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!customDate}
                    onClick={() => commitThree(customDate)}
                    className="rounded-lg border border-border px-3 py-2.5 text-sm disabled:opacity-40"
                  >
                    지정
                  </button>
                </div>

                {/* 건너뛰기를 허용한다. 대신 미배치로 남아 홈 카운터에 잡힌다. */}
                <button
                  type="button"
                  onClick={() => commitThree(null)}
                  className="mt-5 text-sm text-muted underline"
                >
                  건너뛰기 (미배치로 남김)
                </button>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-2.5">
                {QUADRANTS.map((q) => {
                  const spec = QUADRANT_SPEC[q]
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => pick(q)}
                      className="flex flex-col items-start gap-1 rounded-lg border border-border px-3.5 py-4 text-left"
                    >
                      <span className="text-xs text-muted">
                        {spec.id} · {spec.axis}
                      </span>
                      <span className="text-sm font-medium">{spec.verb}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

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
      className="rounded-lg border border-border px-3.5 py-2.5 text-sm"
    >
      {label}
    </button>
  )
}
