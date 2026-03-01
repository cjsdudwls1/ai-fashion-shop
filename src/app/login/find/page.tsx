"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FindAccountPage() {
    const router = useRouter();

    // State for Reset Password
    const [resetName, setResetName] = useState('');
    const [resetPhone, setResetPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState<1 | 2>(1); // 1: verify info, 2: set new password

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleResetPasswordStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const res = await fetch('/api/auth/recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify-user',
                    name: resetName,
                    phone: resetPhone,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '정보가 일치하지 않습니다.');

            setStep(2);
            setMessage('');
        } catch (err: any) {
            setMessage(err.message);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const res = await fetch('/api/auth/recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset-password',
                    name: resetName,
                    phone: resetPhone,
                    newPassword: newPassword
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');

            setMessage('비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.');
            setIsError(false);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setMessage(err.message);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">비밀번호 재설정</h2>
                    <p className="text-sm text-gray-500">
                        {step === 1 ? '가입 시 등록한 사용자 정보를 입력해주세요.' : '새로운 비밀번호를 설정해주세요.'}
                    </p>
                </div>

                {/* Content */}
                <div className="mt-8">
                    {step === 1 ? (
                        <form onSubmit={handleResetPasswordStep1} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">이름</label>
                                <input
                                    type="text"
                                    required
                                    value={resetName}
                                    onChange={(e) => setResetName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="가입 시 등록한 이름"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">휴대전화 번호</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="010-0000-0000"
                                    value={resetPhone}
                                    onChange={(e) => setResetPhone(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                {loading ? '확인 중...' : '확인'}
                            </button>
                        </form>
                    ) : (
                        // Step 2: New Password
                        <form onSubmit={handleResetPasswordFinal} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 mb-4">
                                회원 정보가 확인되었습니다. 새로운 비밀번호를 설정해주세요.
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="새로운 비밀번호 입력 (6자리 이상)"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setMessage(''); }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    이전
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                >
                                    {loading ? '변경 중...' : '변경하기'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Messages (Inline) */}
                    {message && (
                        <div className={`mt-4 text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'} break-keep`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-8 text-center border-t border-gray-200 pt-6">
                        <button onClick={() => router.push('/login')} className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center w-full gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            로그인으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
