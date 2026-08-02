/**
 * 실패했을 때만 뜬다. 성공 토스트는 만들지 않는다 —
 * 캡처는 하루 수십 번 하는 동작이라 매번 확인 메시지가 뜨면 방해가 된다.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-lg border border-red-900/70 bg-black/95 px-4 py-3 text-sm text-red-300"
    >
      {message}
    </div>
  )
}
