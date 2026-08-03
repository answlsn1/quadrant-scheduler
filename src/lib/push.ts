/**
 * 웹푸시 클라이언트 유틸.
 *
 * VAPID 공개키는 이름 그대로 공개용 값이다 — 브라우저가 구독을 만들 때
 * "이 서버가 보내는 푸시만 받겠다"고 서명 주체를 고정하는 용도라 소스에 둔다.
 * 비밀키는 Supabase Vault에 있고 발송 함수만 꺼낼 수 있다.
 */
export const VAPID_PUBLIC_KEY =
  'BPjNEalLaWFawLqAT0EYRvk14v_UctIvcrd-5jBvOeSD_iFN5tPbKHOShFuTE13yKNE9kNeWjGimhPlccCfNV7A'

/** pushManager.subscribe의 applicationServerKey는 Uint8Array를 원한다 */
export function vapidKeyBytes(): Uint8Array {
  const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4)
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** iOS는 홈 화면에 설치된 PWA에서만 웹푸시가 된다 (iOS 16.4+, 애플 제약) */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}
