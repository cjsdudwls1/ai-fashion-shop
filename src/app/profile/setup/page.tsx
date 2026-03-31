"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DaumPostcode from 'react-daum-postcode';

export default function ProfileSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [userId, setUserId] = useState('');
    const [phone, setPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [zonecode, setZonecode] = useState('');
    const [roadAddress, setRoadAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // Postcode Modal State
    const [openPostcode, setOpenPostcode] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserId(user.id);

        // Check if profile already exists/loaded
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            if (profile.phone_number) setPhone(profile.phone_number);
            // Pre-fill recipient name from profile name if available
            if (profile.full_name) setRecipientName(profile.full_name);
        }
        setLoading(false);
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Update Profile (Phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    phone_number: phone,
                    is_setup_finished: true
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // 2. Insert Address
            const { error: addressError } = await supabase
                .from('addresses')
                .insert({
                    user_id: userId,
                    recipient_name: recipientName,
                    recipient_phone: phone,
                    zonecode,
                    road_address: roadAddress,
                    detail_address: detailAddress,
                    is_default: true,
                    address_name: '기본 배송지'
                });

            if (addressError) throw addressError;

            // 3. Update Auth Metadata (Important for Middleware)
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: { is_setup_finished: true }
            });

            if (authUpdateError) {
                console.warn('Auth metadata update failed', authUpdateError);
            }

            alert('설정이 완료되었습니다.');
            window.location.href = '/'; // Force reload/nav to clear middleware checks
        } catch (error: any) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#1A1A1A] p-8 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-[#222] dark:text-white">
                        추가 정보 입력
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        원활한 배송과 서비스를 위해 추가 정보를 입력해주세요.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">휴대전화 번호</label>
                            <input
                                id="phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-800 rounded-xl shadow-sm py-3 px-3 bg-white dark:bg-black text-[15px] focus:outline-none focus:border-black dark:focus:border-gray-500"
                                placeholder="010-0000-0000"
                            />
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">기본 배송지</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">받는 분</label>
                                    <input
                                        type="text"
                                        required
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-800 rounded-xl shadow-sm py-3 px-3 bg-white dark:bg-black text-[15px] focus:outline-none focus:border-black dark:focus:border-gray-500"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">우편번호</label>
                                        <input
                                            type="text"
                                            required
                                            readOnly
                                            value={zonecode}
                                            onClick={() => setOpenPostcode(true)}
                                            className="mt-1 block w-full border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm py-3 px-3 bg-gray-50 dark:bg-[#111] text-gray-500 dark:text-gray-400 cursor-pointer focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOpenPostcode(true)}
                                        className="mt-6 px-4 py-2 border border-gray-300 dark:border-gray-700 text-[14px] font-bold rounded-xl bg-white dark:bg-[#111] text-[#222] dark:text-white hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
                                    >
                                        주소 찾기
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">도로명 주소</label>
                                    <input
                                        type="text"
                                        required
                                        readOnly
                                        value={roadAddress}
                                        className="mt-1 block w-full border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm py-3 px-3 bg-gray-50 dark:bg-[#111] text-gray-500 dark:text-gray-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">상세 주소</label>
                                    <input
                                        type="text"
                                        value={detailAddress}
                                        onChange={(e) => setDetailAddress(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-800 rounded-xl shadow-sm py-3 px-3 bg-white dark:bg-black text-[15px] focus:outline-none focus:border-black dark:focus:border-gray-500"
                                        placeholder="동/호수 등 입력"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-[16px] font-bold text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none"
                        >
                            {saving ? '저장 중...' : '완료하고 시작하기'}
                        </button>
                    </div>
                </form>

                {openPostcode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white w-full max-w-lg rounded-lg shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-medium">주소 검색</h3>
                                <button onClick={() => setOpenPostcode(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <div className="h-[400px]">
                                <DaumPostcode onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
