import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // POST → GET 전환이므로 303.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
