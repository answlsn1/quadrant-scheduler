'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/*
 * 아이콘 대신 글씨를 쓴다. 아이콘은 뜻을 배워야 하지만 글씨는 안 그렇다.
 *
 * 분류 탭은 2026-08-03 사장님 결정으로 제거 — 분류는 홈에서 캡처 직후
 * 패널로, 쌓인 것은 홈 상단 인박스 버튼으로 한다. /classify는 홈으로
 * 리다이렉트만 한다.
 */
const ITEMS = [
  { href: '/', label: '오늘의 일정' },
  { href: '/calendar', label: '캘린더' },
  { href: '/archive', label: '기록' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-safe grid shrink-0 grid-cols-3 border-t border-border bg-background">
      {ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[52px] items-center justify-center text-[13px] ${
              active ? 'text-foreground' : 'text-muted'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
