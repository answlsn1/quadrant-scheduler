'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/', label: '오늘' },
  { href: '/classify', label: '분류' },
  { href: '/board', label: '보드' },
  { href: '/archive', label: '아카이브' },
]

/** 2단계는 기능만. 원핸드 조작 기준 터치 타겟과 배치는 3단계에서 잡는다. */
export function AppNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 mt-auto grid grid-cols-4 border-t border-border bg-background">
      {ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-center gap-1.5 py-4 text-sm ${
              active ? 'text-foreground' : 'text-muted'
            }`}
          >
            {item.label}
            {item.href === '/classify' && inboxCount > 0 ? (
              <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background">
                {inboxCount}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
