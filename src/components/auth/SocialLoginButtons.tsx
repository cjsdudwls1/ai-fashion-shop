'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'

export default function SocialLoginButtons() {
    const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
        const isLocal = window.location.hostname === 'localhost';
        const redirectOrigin = isLocal ? 'http://localhost:3001' : 'https://ai-fashion-shop.netlify.app';

        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${redirectOrigin}/auth/callback`,
            },
        })
    }

    const handleNaverLogin = () => {
        window.location.href = '/api/auth/naver';
    }

    return (
        <div className="flex flex-col gap-3 mt-4">
            <div className="relative mb-2 mt-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-[#111] text-gray-500">또는 다음으로 로그인</span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm bg-white dark:bg-black text-[15px] font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
                {/* Google Logo SVG directly injected to avoid external loading issues */}
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
            </button>

            <button
                type="button"
                onClick={() => handleOAuthLogin('kakao')}
                className="w-full flex justify-center items-center py-3 px-4 rounded-2xl shadow-sm text-[15px] font-bold text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FEE500' }}
            >
                <img src="/kakao_login_symbol.png" alt="Kakao" aria-hidden="true" className="w-5 h-5 mr-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                카카오 로그인
            </button>

            <button
                type="button"
                onClick={handleNaverLogin}
                className="w-full flex justify-center items-center py-3 px-4 rounded-2xl shadow-sm text-[15px] font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#03C75A' }}
            >
                <span className="font-extrabold text-lg mr-3 inline-block leading-none pb-0.5">N</span>
                네이버 로그인
            </button>
        </div>
    )
}
