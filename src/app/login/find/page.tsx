"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FindAccountPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'id' | 'password'>('id');

    // State for Find ID
    const [findIdName, setFindIdName] = useState('');
    const [findIdPhone, setFindIdPhone] = useState('');
    const [foundId, setFoundId] = useState('');
    const [showIdModal, setShowIdModal] = useState(false);

    // State for Reset Password
    const [resetName, setResetName] = useState('');
    const [resetPhone, setResetPhone] = useState('');
    const [resetUsername, setResetUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState<1 | 2>(1); // 1: verify info, 2: set new password

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleFindId = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const res = await fetch('/api/auth/recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'find-id',
                    name: findIdName,
                    phone: findIdPhone,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');

            setFoundId(data.username);
            setShowIdModal(true);
        } catch (err: any) {
            setMessage(err.message);
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

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
                    username: resetUsername,
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
                    username: resetUsername,
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
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'id'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => { setActiveTab('id'); setMessage(''); setFoundId(''); setShowIdModal(false); }}
                    >
                        아이디 찾기
                    </button>
                    <button
                        className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'password'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => { setActiveTab('password'); setMessage(''); setStep(1); }}
                    >
                        비밀번호 재설정
                    </button>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {activeTab === 'id' ? (
                        <form onSubmit={handleFindId} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">이름</label>
                                <input
                                    type="text"
                                    required
                                    value={findIdName}
                                    onChange={(e) => setFindIdName(e.target.value)}
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
                                    value={findIdPhone}
                                    onChange={(e) => setFindIdPhone(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                {loading ? '검색 중...' : '아이디 찾기'}
                            </button>
                        </form>
                    ) : (
                        // Password Reset Flow
                        step === 1 ? (
                            <form onSubmit={handleResetPasswordStep1} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">아이디</label>
                                    <input
                                        type="text"
                                        required
                                        value={resetUsername}
                                        onChange={(e) => setResetUsername(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="아이디 입력"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">이름</label>
                                    <input
                                        type="text"
                                        required
                                        value={resetName}
                                        onChange={(e) => setResetName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                            <form onSubmit={handleResetPasswordFinal} className="space-y-6">
                                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 mb-4">
                                    정보가 확인되었습니다. 새로운 비밀번호를 설정해주세요.
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="새로운 비밀번호 입력"
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
                        )
                    )}

                    {/* Messages (Inline) */}
                    {message && !showIdModal && (
                        <div className={`mt-4 text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'} break-keep`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button onClick={() => router.push('/login')} className="text-sm text-gray-500 hover:text-gray-900 border px-4 py-2 rounded">
                            로그인으로 돌아가기
                        </button>
                    </div>
                </div>

                {/* Modal for Found ID */}
                {showIdModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">아이디 찾기 결과</h3>
                            <p className="text-gray-600 mb-2">회원님의 아이디는</p>
                            <p className="text-2xl font-bold text-indigo-600 mb-6">{foundId}</p>
                            <button
                                onClick={() => { setShowIdModal(false); router.push('/login'); }}
                                className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                로그인하러 가기
                            </button>
                            <button
                                onClick={() => setShowIdModal(false)}
                                className="mt-3 text-sm text-gray-500 hover:text-gray-900 block w-full"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
