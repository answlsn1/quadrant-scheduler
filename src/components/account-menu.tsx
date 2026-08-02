'use client'

import { useEffect, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * 우상단 계정 메뉴. (사장님 요청 2026-08-02 — 텍스트 로그아웃 링크 대체)
 *
 * 다중 사용자가 되면서 "내가 누구로 로그인돼 있는지"가 정보가 됐다.
 * 구글 프로필의 이니셜 원을 상시 보여주고, 탭하면 이름·이메일과
 * 로그아웃 버튼이 펼쳐진다. 로그아웃은 하루에 한 번도 안 쓰는 동작이라
 * 한 단계 뒤로 숨기는 것이 맞다 — 지금까지는 실수로 눌리기 좋은 자리에
 * 맨몸으로 나와 있었다.
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getClaims().then(({ data }) => {
      const claims = data?.claims
      if (!claims) return

      setEmail(typeof claims.email === 'string' ? claims.email : null)

      const meta = claims.user_metadata as Record<string, unknown> | undefined
      const fullName = meta?.full_name ?? meta?.name
      setName(typeof fullName === 'string' ? fullName : null)
    })
  }, [])

  // 바깥을 탭하면 닫힌다
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const initial = (name ?? email ?? '·').trim().charAt(0).toUpperCase()

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="계정 메뉴"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-full border bg-surface text-sm font-medium transition-colors duration-150 ${
          open ? 'border-foreground' : 'border-border hover:border-muted'
        }`}
      >
        {initial}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-surface p-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <p className="truncate text-sm font-medium">{name ?? '이름 없음'}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{email ?? ''}</p>

          <a
            href="/guide"
            className="mt-3 flex min-h-[44px] items-center justify-center rounded-lg border border-border text-sm text-muted transition-colors duration-150 hover:border-muted hover:text-foreground"
          >
            앱 사용법
          </a>

          <form action="/logout" method="post" className="mt-2 border-t border-border pt-2">
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted transition-colors duration-150 hover:border-muted hover:text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M6 3.5H4A1.5 1.5 0 0 0 2.5 5v6A1.5 1.5 0 0 0 4 12.5h2M10.5 10.5 13 8l-2.5-2.5M12.5 8H6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              로그아웃
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
