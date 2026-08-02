'use client'

import { useRef, useState, type FormEvent } from 'react'

/**
 * 캡처 입력창. 화면 최하단에 붙는다 (3단계 시안 확정).
 *
 * 위가 아니라 아래인 이유: 원핸드 조작 기준 엄지가 닿는 곳은 아래이고,
 * 키보드가 올라오면 입력창이 그 바로 위에 붙어 이동 거리가 0이 된다.
 */
export function CaptureBar({
  onCapture,
}: {
  onCapture: (title: string) => Promise<boolean>
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

    const ok = await onCapture(value)
    if (!ok) setDraft(value) // 실패했으면 쓴 내용을 돌려준다
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-2 pt-2">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="떠오른 것을 그냥 적는다"
        aria-label="캡처"
        className="min-h-[52px] w-full rounded-xl border border-border bg-surface px-4 py-3.5 caret-[var(--q3)] outline-none placeholder:text-muted focus:border-[var(--q3)]"
      />
    </form>
  )
}
