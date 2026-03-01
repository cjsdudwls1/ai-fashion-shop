import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'

export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

// 클라이언트 측 토큰 갱신 실패 처리
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' && !session) {
            // 토큰 갱신 실패: 세션 삭제 후 로그인 페이지로 이동
            supabase.auth.signOut().then(() => {
                window.location.href = '/login'
            })
        }
    })
}
