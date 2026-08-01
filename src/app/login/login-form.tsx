'use client'

import { useEffect, useState, type FormEvent } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * 회원가입 UI는 없다. 계정은 Supabase 대시보드에서 시드로 1개만 만든다.
 * (작업지시서 3장 — 지누 1인용 자가도구)
 */
export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  /*
   * 하이드레이션이 끝나기 전까지 제출을 막는다.
   * 이 form에는 action이 없어서, onSubmit 핸들러가 붙기 전에 버튼이 눌리면
   * 브라우저가 현재 URL로 네이티브 GET 제출을 해버린다.
   * 그러면 비밀번호가 쿼리스트링(/login?email=...&password=...)에 실려
   * 브라우저 기록과 서버 접근 로그에 남는다. 실제로 재현됨.
   */
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    setPending(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 맞지 않습니다.'
          : signInError.message,
      )
      setPending(false)
      return
    }

    // 하드 내비게이션. 방금 심어진 세션 쿠키를 서버(proxy.ts)가 확실히 보게 한다.
    window.location.replace(next)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">이메일</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          className="rounded-lg border border-border bg-transparent px-3 py-3 outline-none focus:border-foreground"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">비밀번호</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-border bg-transparent px-3 py-3 outline-none focus:border-foreground"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!hydrated || pending}
        className="mt-2 rounded-lg bg-foreground px-3 py-3 font-medium text-background disabled:opacity-50"
      >
        {pending ? '확인 중' : '로그인'}
      </button>
    </form>
  )
}
