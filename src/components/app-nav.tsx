'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/*
 * 아이콘 대신 글씨를 쓴다. 아이콘은 뜻을 배워야 하지만 글씨는 안 그렇다.
 * 1인용 도구에 학습 비용을 넣을 이유가 없다. (3단계 시안 확정)
 * "아카이브"는 좁은 탭바에서 눌려서 "기록"으로 줄였다.
 */
const ITEMS = [
  { href: '/', label: '오늘' },
  { href: '/classify', label: '분류' },
  { href: '/board', label: '보드' },
  { href: '/archive', label: '기록' },
]

export function AppNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="bottom-safe grid shrink-0 grid-cols-4 border-t border-border bg-background">
      {ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[52px] items-center justify-center gap-1.5 text-[13px] ${
              active ? 'text-foreground' : 'text-muted'
            }`}
          >
            {item.label}
            {item.href === '/classify' && inboxCount > 0 ? (
              <span className="min-w-[18px] rounded-full bg-foreground px-1.5 text-center text-[11px] font-medium tabular-nums text-background">
                {inboxCount}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
