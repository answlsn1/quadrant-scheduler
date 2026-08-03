/*
 * 푸시 알림 전용 서비스워커.
 *
 * ⚠️ fetch 핸들러를 절대 추가하지 마라. 이 앱의 갱신 모델은
 * "캐시 레이어가 없어서 열 때마다 최신"이다 (DECISIONS 2026-08-02).
 * fetch를 가로채는 순간 그 전제가 깨진다. 이 파일은 push 표시와
 * 알림 클릭 처리만 한다.
 */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    // 파싱 실패 시 기본 문구로 표시한다
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '오늘의 일정', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-digest', // 같은 태그면 중복 알림이 쌓이지 않고 갱신된다
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(event.notification.data?.url || '/')
    }),
  )
})
