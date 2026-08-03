type Props = {
  message: string | null
  /** error(기본)는 실패 알림, info는 실행취소처럼 중립적인 안내다 */
  tone?: 'error' | 'info'
  /** 있으면 우측에 동작 버튼이 붙는다 (예: 실행취소) */
  action?: { label: string; onClick: () => void }
}

/**
 * 실패했을 때만 뜬다는 원칙은 유지하되, 실행취소(2026-08-03 승인)처럼
 * 짧은 되돌림 창구가 필요한 경우에 한해 info 톤을 쓴다.
 * 성공 확인용 토스트는 여전히 만들지 않는다.
 *
 * 하단 캡처창·탭바를 가리지 않도록 그 위에 띄운다.
 */
export function Toast({ message, tone = 'error', action }: Props) {
  if (!message) return null

  const toneClass =
    tone === 'error'
      ? 'border-[color-mix(in_srgb,var(--q1)_45%,transparent)] text-[var(--q1)]'
      : 'border-border text-foreground'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-4 bottom-32 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-sm ${toneClass}`}
    >
      <span className="min-w-0 flex-1 truncate">{message}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="pointer-events-auto min-h-[40px] shrink-0 rounded-lg px-3 text-sm font-medium text-[var(--accent)]"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
