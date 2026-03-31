import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Lock } from 'lucide-react';
import { nameToEmail } from '@/lib/authHelpers';
import SocialLoginButtons from './SocialLoginButtons';

export interface LoginFormProps {
    onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const email = nameToEmail(name);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage('입력하신 정보가 일치하지 않습니다. 이름과 비밀번호를 다시 확인해주세요.');
        } else {
            router.push('/');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="relative group">
                    <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">이름</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type="text"
                            required
                            autoComplete="name"
                            style={{ paddingLeft: '52px' }}
                            className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                            placeholder="이름을 입력하세요"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="relative group">
                    <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">비밀번호</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            autoComplete="current-password"
                            style={{ paddingLeft: '52px', paddingRight: '64px' }}
                            className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle-btn absolute inset-y-0 right-0 px-3 text-sm font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            {showPassword ? '숨기기' : '보기'}
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[17px] font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl hover:scale-[1.01] disabled:opacity-50 mt-6"
            >
                {loading ? '처리 중...' : '로그인하기'}
            </button>

            <SocialLoginButtons />

            <div className="flex flex-col items-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm tracking-wide">아직 회원이 아니신가요?</span>
                    <button
                        type="button"
                        onClick={onToggleMode}
                        className="font-bold text-sm underline underline-offset-4 text-purple-500 hover:text-pink-500 transition-colors"
                    >
                        회원가입 하기
                    </button>
                </div>
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={() => router.push('/login/find')}
                        className="text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                    >
                        아이디 / 비밀번호 찾기
                    </button>
                </div>
            </div>

            {message && (
                <div className={`text-center text-sm p-4 rounded-xl font-bold ${message.includes('성공') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {message}
                </div>
            )}
        </form>
    );
}