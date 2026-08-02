/**
 * 실패했을 때만 뜬다. 성공 토스트는 만들지 않는다 —
 * 캡처는 하루 수십 번 하는 동작이라 매번 확인 메시지가 뜨면 그 자체가 방해다.
 *
 * 하단 캡처창·탭바를 가리지 않도록 그 위에 띄운다.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-32 z-50 mx-auto max-w-sm rounded-xl border border-[color-mix(in_srgb,var(--q1)_45%,transparent)] bg-surface px-4 py-3 text-sm text-[var(--q1)]"
    >
      {message}
    </div>
  )
}
