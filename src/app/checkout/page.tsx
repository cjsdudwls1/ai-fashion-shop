"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import DaumPostcode from 'react-daum-postcode';
import toast from 'react-hot-toast';

// 분리된 컴포넌트 임포트
import ShippingForm from '@/components/checkout/ShippingForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import PaymentSection from '@/components/checkout/PaymentSection';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [guestOrderCode, setGuestOrderCode] = useState('');
    const [mounted, setMounted] = useState(false);

    const [shippingInfo, setShippingInfo] = useState({
        name: '',
        phone: '',
        zonecode: '',
        roadAddress: '',
        detailAddress: '',
        memo: ''
    });

    const [openPostcode, setOpenPostcode] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');

    // 로그인 상태 확인 및 기존 배송지 자동 입력
    useEffect(() => {
        setMounted(true);
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsLoggedIn(true);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, phone_number')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    setShippingInfo(prev => ({
                        ...prev,
                        name: profile.full_name || '',
                        phone: profile.phone_number || ''
                    }));
                }
                const { data: address } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_default', true)
                    .single();
                if (address) {
                    setShippingInfo(prev => ({
                        ...prev,
                        zonecode: address.zonecode || '',
                        roadAddress: address.road_address || '',
                        detailAddress: address.detail_address || ''
                    }));
                }
            }
        };
        checkUser();
    }, []);

    // Daum 우편번호 완료 핸들러
    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') extraAddress += data.bname;
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        setShippingInfo(prev => ({
            ...prev,
            zonecode: data.zonecode,
            roadAddress: fullAddress
        }));
        setOpenPostcode(false);
    };

    if (!mounted) return <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-12"></div>;

    if (items.length === 0 && !orderComplete) {
        return (
            <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-center">
                <p className="text-[var(--text-secondary)] mb-4">장바구니가 비어있습니다.</p>
                <button onClick={() => router.push('/products')} className="text-indigo-500 font-bold underline">쇼핑하러 가기</button>
            </div>
        );
    }

    // 주문 완료 화면
    if (orderComplete) {
        return (
            <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center px-4">
                <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border-color)] p-8 sm:p-12 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3">주문 완료</h2>
                    <p className="text-[var(--text-secondary)] mb-8">주문이 성공적으로 접수되었습니다.</p>

                    {guestOrderCode && (
                        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 mb-8">
                            <p className="text-sm font-bold text-amber-500 mb-2">비회원 주문 조회 코드</p>
                            <p className="text-3xl font-black text-amber-400 tracking-widest mb-3">{guestOrderCode}</p>
                            <p className="text-xs text-amber-500/80">
                                이 코드를 기억해주세요! 주문 조회 시 필요합니다.
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {guestOrderCode ? (
                            <button
                                onClick={() => router.push('/order-lookup')}
                                className="w-full h-14 bg-[var(--text-primary)] text-[var(--bg-dark)] font-bold rounded-xl hover:opacity-90 transition-all"
                            >
                                주문 조회하기
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/profile')}
                                className="w-full h-14 bg-[var(--text-primary)] text-[var(--bg-dark)] font-bold rounded-xl hover:opacity-90 transition-all"
                            >
                                주문 내역 보기
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/products')}
                            className="w-full h-14 bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--border-color)] transition-all"
                        >
                            쇼핑 계속하기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.roadAddress) {
            toast.error('배송지 정보를 모두 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const fullAddress = shippingInfo.detailAddress
                ? `[${shippingInfo.zonecode}] ${shippingInfo.roadAddress}, ${shippingInfo.detailAddress}`
                : `[${shippingInfo.zonecode}] ${shippingInfo.roadAddress}`;

            // Minimize payload by removing image data (Base64 strings are large)
            const orderItems = items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
                price: item.price // Note: Ideally price should be verified on server
            }));

            const { data, error } = await supabase.rpc('complete_order', {
                p_items: orderItems,
                p_shipping_info: {
                    name: shippingInfo.name,
                    phone: shippingInfo.phone,
                    address: fullAddress,
                    memo: shippingInfo.memo
                },
                p_total_amount: getTotalPrice()
            });

            if (error) throw error;

            if (data?.guest_order_code) {
                setGuestOrderCode(data.guest_order_code);
            }

            clearCart();
            setOrderComplete(true);
            toast.success('주문이 완료되었습니다!');

        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-24">
            <div className="container-main">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">주문/결제</h1>
                    {!isLoggedIn && (
                        <div className="flex items-center gap-2 mb-6 bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-3 rounded-xl border border-indigo-500/20">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>비회원 주문입니다. 주문 완료 후 <strong>주문 조회 코드</strong>가 발급됩니다.</span>
                        </div>
                    )}

                    <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 왼쪽: 배송 정보 & 상품 정보 */}
                        <div className="space-y-6">
                            <ShippingForm
                                shippingInfo={shippingInfo}
                                setShippingInfo={setShippingInfo}
                                setOpenPostcode={setOpenPostcode}
                            />
                            <OrderSummary items={items} />
                        </div>

                        {/* 오른쪽: 결제 정보 */}
                        <PaymentSection
                            totalPrice={getTotalPrice()}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            loading={loading}
                        />
                    </form>
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
            </div>
        </div>
    );
}
