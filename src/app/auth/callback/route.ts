import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/authUtils'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // [보안 검증] Open Redirect 취약점 방지
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const redirectBase = isLocalEnv ? origin 
        : forwardedHost ? `https://${forwardedHost}` 
        : origin
        
      // 프로필 설정 여부 체크 (is_setup_finished)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
         const { data: profile } = await supabase
             .from('profiles')
             .select('is_setup_finished')
             .eq('id', session.user.id)
             .single()
             
         if (profile && !profile.is_setup_finished) {
             return NextResponse.redirect(`${redirectBase}/profile/setup`)
         }
      }
        
      return NextResponse.redirect(`${redirectBase}${next}`)
    } else {
        console.error('exchangeCodeForSession error:', error)
    }
  }
  
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
