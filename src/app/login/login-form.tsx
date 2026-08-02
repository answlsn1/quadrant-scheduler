'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * 구글 로그인 전용. 비밀번호도, 회원가입도 없다.
 * 계정은 `src/lib/auth.ts`의 허용 목록에 있는 하나뿐이다.
 */
export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // 하이드레이션 전에는 눌러도 아무 일이 없으므로 버튼을 잠가 둔다.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  async function signInWithGoogle() {
    if (pending) return
    setPending(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    // 여기까지 왔다는 건 구글로 넘어가지 못했다는 뜻이다.
    if (oauthError) {
      setError(`구글 로그인을 시작하지 못했습니다. ${oauthError.message}`)
      setPending(false)
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-3">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={!hydrated || pending}
        className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-foreground px-4 font-medium text-background disabled:opacity-50"
      >
        <GoogleMark />
        {pending ? '구글로 이동 중' : '구글로 로그인'}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C3 17.1 2.1 20.4 2.1 24s.9 6.9 2.4 9.9l7.3-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"
      />
    </svg>
  )
}
