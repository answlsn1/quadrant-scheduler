'use client'

import { useEffect, useRef } from 'react'

/** 열어둔 채 방치된 앱이 새 배포를 얼마나 늦게 알아채도 되는지 */
const POLL_MS = 30 * 60 * 1000

/**
 * 조용한 자동 갱신.
 *
 * 서비스 워커가 없어서 앱을 새로 열면 항상 최신이다. 문제는 앱을 닫지 않고
 * 며칠 백그라운드에 두는 경우다. 그 세션은 계속 옛 빌드로 돌고, 나중에 DB
 * 스키마가 바뀌면 새 스키마와 어긋난다.
 *
 * 그래서 포그라운드로 돌아올 때(그리고 열어둔 채라면 주기적으로) 서버의 배포
 * 식별자를 확인하고, 달라졌으면 새로고침한다. 배너도 알림도 띄우지 않는다 —
 * "새 버전을 받을까요"는 사장님이 판단할 게 없는 질문이라 물어볼 이유가 없다.
 */
export function AppUpdater() {
  const reloadingRef = useRef(false)

  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'
    // 로컬 개발에서는 값이 고정이라 확인할 의미가 없다
    if (current === 'dev') return

    async function check() {
      if (reloadingRef.current || document.visibilityState !== 'visible') return

      try {
        const res = await fetch('/api/build', { cache: 'no-store' })
        if (!res.ok) return

        const { id } = (await res.json()) as { id?: string }
        if (!id || id === current) return
        if (!safeToReload()) return // 쓰던 글이 날아가면 안 된다. 다음 기회에 한다.

        reloadingRef.current = true
        window.location.reload()
      } catch {
        // 오프라인이거나 세션이 끊긴 상황. 갱신 확인은 실패해도 조용히 넘어간다.
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void check()
    }

    void check()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const timer = window.setInterval(check, POLL_MS)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  return null
}

/** 입력 중이거나 쓰다 만 글이 남아 있으면 새로고침하지 않는다 */
function safeToReload(): boolean {
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input, textarea',
  )

  for (const field of fields) {
    if (document.activeElement === field) return false

    // 날짜 입력의 값은 사용자가 쓰다 만 글이 아니라 저장된 데이터다
    const isDraftField = field.tagName === 'TEXTAREA' || !('type' in field) || field.type === 'text'
    if (isDraftField && field.value.trim() !== '') return false
  }

  return true
}
