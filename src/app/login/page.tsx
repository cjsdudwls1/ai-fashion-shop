"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    const toggleMode = () => setIsLogin(!isLogin);

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-gray-900 shadow-[0_-2px_6px_rgba(0,0,0,0.02)] dark:shadow-none">
            {/* 왼쪽 브랜딩 섹션 (PC 버전) */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] items-center justify-center overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                <div className="relative z-10 p-12 text-white max-w-xl">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                        <Zap className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-6xl font-bold mb-8 leading-tight tracking-tight">
                        Discover Your<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Perfect Style</span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed font-light">
                        AI가 제안하는 나만의 패션 큐레이션.<br />
                        당신의 취향을 분석하여 가장 완벽한 스타일을 찾아드립니다.
                    </p>
                </div>
            </div>

            {/* 오른쪽 폼 섹션 */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-5 sm:px-10 lg:px-24 py-12 bg-white dark:bg-[#121212] relative overflow-x-hidden overflow-y-auto">
                {/* 뒤로 가기 */}
                <button
                    onClick={() => router.back()}
                    aria-label="뒤로 가기"
                    className="absolute top-8 left-8 p-3 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-all z-10"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="w-full max-w-[520px]" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                            {isLogin ? '로그인' : '회원가입'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                            {isLogin ? 'AI 패션샵에 오신 것을 환영해요.' : '간단한 정보를 입력하고 시작하세요.'}
                        </p>
                    </div>

                    {/* 폼 렌더링 */}
                    {isLogin ? (
                        <LoginForm onToggleMode={toggleMode} />
                    ) : (
                        <SignupForm onToggleMode={toggleMode} onSignupSuccess={() => setIsLogin(true)} />
                    )}
                </div>
            </div>

        </div>
    );
}