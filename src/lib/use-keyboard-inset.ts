'use client'

import { useEffect, useState } from 'react'

/**
 * 화면 아래를 소프트 키보드가 얼마나 덮고 있는지(px).
 *
 * 캡처 입력창을 화면 최하단에 두기로 했으므로(3단계 시안 확정),
 * 키보드가 올라올 때 입력창이 그 밑에 깔리면 안 된다.
 * position: fixed는 레이아웃 뷰포트 기준이라 iOS에서 키보드를 인식하지 못한다.
 * visualViewport가 실제로 보이는 영역을 알려주는 유일한 수단이다.
 *
 * 미지원 브라우저(구형)에서는 항상 0이라 기존 동작 그대로다.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function update() {
      if (!vv) return
      const covered = window.innerHeight - vv.height - vv.offsetTop
      // 주소창 애니메이션 중의 소수점 흔들림은 무시한다
      setInset(covered > 24 ? Math.round(covered) : 0)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
