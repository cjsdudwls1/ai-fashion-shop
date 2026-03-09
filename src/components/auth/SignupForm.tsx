import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { nameToEmail } from '@/lib/authHelpers';
import { User, Lock, Phone, MapPin, X } from 'lucide-react';
import { useAddress } from '@/hooks/useAddress';
import dynamic from 'next/dynamic';

const DaumPostcode = dynamic(() => import('react-daum-postcode'), {
    loading: () => <div style={{ height: '450px', background: 'var(--bg-elevated)' }} className="animate-shimmer" />,
    ssr: false,
});

export interface SignupFormProps {
    onToggleMode: () => void;
    onSignupSuccess: () => void;
}

export default function SignupForm({ onToggleMode, onSignupSuccess }: SignupFormProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // 주소 커스텀 훅 사용
    const [{ zonecode, roadAddress, detailAddress, openPostcode }, { setDetailAddress, setOpenPostcode, handleCompletePostcode }] = useAddress();

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

            onSignupSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="relative">
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 이름 */}
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

                    {/* 비밀번호 */}
                    <div className="relative group">
                        <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">
                            비밀번호
                            <span className="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2">* 최소 6자 이상 입력해주세요</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                autoComplete="new-password"
                                style={{ paddingLeft: '52px', paddingRight: '64px' }}
                                className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white text-base focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                placeholder="비밀번호 입력 (6자리 이상)"
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

                    {/* 전화번호 */}
                    <div className="relative group animate-fade-in-down">
                        <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">전화번호</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400 dark:group-focus-within:text-white transition-colors" />
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
                                    <MapPin className="h-5 w-5 text-gray-400" />
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
                </div>

                {/* 메인 버튼 */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[17px] font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl hover:scale-[1.01] disabled:opacity-50 mt-6"
                >
                    {loading ? '처리 중...' : '가입 완료하기'}
                </button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400 text-sm tracking-wide">이미 계정이 있으신가요?</span>
                    <button
                        type="button"
                        onClick={onToggleMode}
                        className="font-bold text-sm underline underline-offset-4 text-purple-500 hover:text-pink-500 transition-colors"
                    >
                        로그인 하기
                    </button>
                </div>
            </div>

            {message && (
                <div className={`text-center text-sm p-4 rounded-xl font-bold ${message.includes('성공') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {message}
                </div>
            )}

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
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="h-[450px]">
                            <DaumPostcode onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}