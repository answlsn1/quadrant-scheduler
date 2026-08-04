'use client'

import { useRef, useState, type FormEvent } from 'react'

/**
 * 캡처 입력창. 화면 최하단에 붙는다 (3단계 시안 확정).
 *
 * 위가 아니라 아래인 이유: 원핸드 조작 기준 엄지가 닿는 곳은 아래이고,
 * 키보드가 올라오면 입력창이 그 바로 위에 붙어 이동 거리가 0이 된다.
 *
 * 우측 → 버튼은 메시지 앱의 전송 버튼과 같은 문법이다 (사장님 요청 2026-08-02).
 * Enter로도 당연히 저장된다 — 버튼은 "여기 적으면 저장된다"를 눈으로 말해주는 장치.
 */
export function CaptureBar({
  onCapture,
}: {
  /** 저장 성공 시 새 항목 id, 실패 시 null */
  onCapture: (title: string) => Promise<string | null>
}) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = draft
    if (!value.trim()) return

    // 먼저 비우고 포커스를 유지한다. 연속으로 쏟아붓는 흐름이 끊기면 안 된다.
    setDraft('')
    inputRef.current?.focus()

    const newId = await onCapture(value)
    if (!newId) setDraft(value) // 실패했으면 쓴 내용을 돌려준다
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-2 pt-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="떠오르는 것을 그냥 적어보자"
          aria-label="캡처"
          className="min-h-[52px] w-full rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-surface-hi py-3.5 pl-4 pr-14 shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)] caret-[var(--accent)] outline-none placeholder:text-muted focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="저장"
          className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--accent)] text-background transition-opacity duration-150 disabled:opacity-25"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
