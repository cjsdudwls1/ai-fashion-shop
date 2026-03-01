"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// P3-4: Daum 주소 컴포넌트 dynamic import — 초기 번들에서 제외하여 로딩 성능 개선
const DaumPostcode = dynamic(() => import('react-daum-postcode'), {
    loading: () => <div style={{ height: '450px', background: 'var(--bg-elevated)' }} className="animate-shimmer" />,
    ssr: false,
});

// 이름을 내부 이메일 형식으로 변환 (Supabase Auth용)
const nameToEmail = (inputName: string): string => {
    const name = inputName.trim();

    // 이메일 형식이면 그대로 사용
    if (name.includes('@')) {
        return name;
    }

    // UTF-8 바이트 → hex 인코딩
    const encoder = new TextEncoder();
    const bytes = encoder.encode(name);
    let hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    // 길이 제한 (이메일 로컬파트 64자 이내)
    if (hex.length > 50) {
        // 긴 이름은 해시로 축약
        let h1 = 0x811c9dc5;
        let h2 = 0;
        for (let i = 0; i < name.length; i++) {
            const c = name.charCodeAt(i);
            h1 ^= c;
            h1 = Math.imul(h1, 0x01000193) >>> 0;
            h2 = (h2 * 31 + c) >>> 0;
        }
        hex = `${h1.toString(36)}${h2.toString(36)}${name.length.toString(36)}`;
    }
    return `u_${hex}@aifashion-store.com`;
};

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    // 주소 관련 상태
    const [zonecode, setZonecode] = useState('');
    const [roadAddress, setRoadAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [openPostcode, setOpenPostcode] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Daum 우편번호 검색 완료 핸들러
    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setZonecode(data.zonecode);
        setRoadAddress(fullAddress);
        setOpenPostcode(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const email = nameToEmail(name);

        const { data, error } = await supabase.auth.signInWithPassword({
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 이름 유효성 검사 (한글, 영대소문자, 숫자, 띄어쓰기만 허용)
        const nameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
        if (!nameRegex.test(name.trim())) {
            setMessage('이름에는 한글, 영문, 숫자만 사용할 수 있습니다.');
            setLoading(false);
            return;
        }

        if (name.trim().length > 50) {
            setMessage('이름은 50자 이내로 입력해주세요.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage('비밀번호는 6자리 이상이어야 합니다.');
            setLoading(false);
            return;
        }

        if (!roadAddress) {
            setMessage('주소를 검색하여 입력해주세요.');
            setLoading(false);
            return;
        }

        const fullAddress = detailAddress
            ? `[${zonecode}] ${roadAddress}, ${detailAddress}`
            : `[${zonecode}] ${roadAddress}`;

        const email = nameToEmail(name);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name.trim(),
                    phone_number: phone.trim(),
                    address: fullAddress,
                    is_setup_finished: true,
                },
            },
        });

        if (error) {
            console.error('Signup error:', error);
            if (error.message.includes('already registered')) {
                setMessage('이미 사용 중인 이름입니다. 다른 이름으로 가입해주세요.');
            } else if (error.message.includes('invalid') || error.message.includes('email')) {
                setMessage('유효하지 않은 이메일 또는 이름 형식입니다.');
            } else {
                setMessage('회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
            setLoading(false);
            return;
        }

        if (data.user) {
            // 트리거가 profiles 행을 생성할 시간을 확보
            await new Promise(resolve => setTimeout(resolve, 500));

            // profiles 테이블에 정보 저장 (upsert로 안전하게)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    username: name.trim(),
                    full_name: name.trim(),
                    phone_number: phone.trim(),
                    is_setup_finished: true,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Profile upsert error:', profileError);
            }

            // addresses 테이블에도 기본 배송지 저장
            const { error: addressError } = await supabase
                .from('addresses')
                .insert({
                    user_id: data.user.id,
                    recipient_name: name.trim(),
                    recipient_phone: phone.trim(),
                    zonecode,
                    road_address: roadAddress,
                    detail_address: detailAddress,
                    is_default: true,
                    address_name: '기본 배송지',
                });

            if (addressError) {
                console.error('Address insert error:', addressError);
            }

            setMessage('회원가입 성공! 로그인해주세요.');
            setIsLogin(true);
            setPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-gray-900 shadow-[0_-2px_6px_rgba(0,0,0,0.02)] dark:shadow-none">
            {/* 왼쪽 브랜딩 섹션 (PC 버전) */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] items-center justify-center overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                <div className="relative z-10 p-12 text-white max-w-xl">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
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

            {/* 오른쪽 로그인 폼 섹션 — P1-2: 모바일 최소 패딩 px-5 확보 */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-5 sm:px-10 lg:px-24 py-12 bg-white dark:bg-[#121212] relative overflow-x-hidden overflow-y-auto">

                {/* 뒤로 가기 */}
                <button
                    onClick={() => router.back()}
                    aria-label="뒤로 가기"
                    className="absolute top-8 left-8 p-3 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-full transition-all z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
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

                    {/* 폼 */}
                    <form onSubmit={isLogin ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* 이름 */}
                            <div className="relative group">
                                <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">이름</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
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

                            {/* 비밀번호 */}
                            <div className="relative group">
                                <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">
                                    비밀번호
                                    {!isLogin && <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2">* 최소 6자 이상 입력해주세요</span>}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        autoComplete={isLogin ? "current-password" : "new-password"}
                                        style={{ paddingLeft: '52px', paddingRight: '64px' }}
                                        className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                        placeholder={isLogin ? "비밀번호 입력" : "비밀번호 입력 (6자리 이상)"}
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

                            {/* 회원가입 전용 필드 */}
                            {!isLogin && (
                                <>

                                    {/* 전화번호 */}
                                    <div className="relative group animate-fade-in-down">
                                        <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">전화번호</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400 dark:group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498" />
                                                </svg>
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                style={{ paddingLeft: '52px' }}
                                                className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                                placeholder="010-0000-0000"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* 주소 - Daum Postcode API */}
                                    <div className="relative group animate-fade-in-down">
                                        <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">주소</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    required
                                                    style={{ paddingLeft: '52px' }}
                                                    className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base cursor-pointer outline-none"
                                                    placeholder="우편번호"
                                                    value={zonecode}
                                                    onClick={() => setOpenPostcode(true)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenPostcode(true)}
                                                className="h-14 px-5 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition-all whitespace-nowrap"
                                            >
                                                주소 검색
                                            </button>
                                        </div>

                                        {/* 도로명 주소 (검색 결과) */}
                                        {roadAddress && (
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 text-base px-5 outline-none"
                                                    value={roadAddress}
                                                />
                                            </div>
                                        )}

                                        {/* 상세 주소 (자유 입력) */}
                                        {roadAddress && (
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    style={{ paddingLeft: '52px' }}
                                                    className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                                    placeholder="상세주소 입력 (동/호수 등)"
                                                    value={detailAddress}
                                                    onChange={(e) => setDetailAddress(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 메인 버튼 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[17px] font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl hover:scale-[1.01] disabled:opacity-50 mt-6"
                        >
                            {loading ? '처리 중...' : (isLogin ? '로그인하기' : '가입 완료하기')}
                        </button>
                    </form>

                    {/* 하단 링크 */}
                    <div className="flex flex-col items-center gap-4 mt-6">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-400 text-sm tracking-wide">{isLogin ? '아직 회원이 아니신가요?' : '이미 계정이 있으신가요?'}</span>
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
                                className="font-bold text-sm underline underline-offset-4 text-purple-500 hover:text-pink-500 transition-colors"
                            >
                                {isLogin ? '회원가입 하기' : '로그인 하기'}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push('/login/find')}
                                    className="text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                                >
                                    아이디 / 비밀번호 찾기
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 메시지 */}
                    {message && (
                        <div className={`text-center text-sm p-4 rounded-xl font-bold ${message.includes('성공') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Daum Postcode 모달 */}
            {openPostcode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b">
                            <h3 className="text-lg font-bold text-gray-900">주소 검색</h3>
                            <button
                                onClick={() => setOpenPostcode(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="h-[450px]">
                            <DaumPostcode onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* 애니메이션 스타일 */}
            <style jsx>{`
                @keyframes fade-in-down {
                    0% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}