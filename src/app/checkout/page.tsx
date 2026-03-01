"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import ShippingForm from '@/components/checkout/ShippingForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { ADMIN_BANK_INFO } from '@/lib/orderUtils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotalPrice, updatePrices, clearCart } = useCartStore();

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Shipping Info State
    const [shippingInfo, setShippingInfo] = useState({
        name: '',
        phone: '',
        zonecode: '',
        roadAddress: '',
        detailAddress: '',
        memo: ''
    });

    // 입금자명
    const [depositorName, setDepositorName] = useState('');

    // 실시간 유효성 검사 (#5-3)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    const [isProcessing, setIsProcessing] = useState(false);
    const [openPostcode, setOpenPostcode] = useState(false);

    // 실시간 유효성 검사 로직
    useEffect(() => {
        const errors: Record<string, string> = {};

        if (touchedFields.name && !shippingInfo.name.trim()) {
            errors.name = '받는 분 이름을 입력해주세요.';
        }
        if (touchedFields.phone) {
            if (!shippingInfo.phone.trim()) {
                errors.phone = '연락처를 입력해주세요.';
            } else if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(shippingInfo.phone.replace(/-/g, '').replace(/^01/, '01'))) {
                // 간단한 전화번호 형식 체크만
                if (shippingInfo.phone.replace(/-/g, '').length < 10) {
                    errors.phone = '올바른 연락처를 입력해주세요.';
                }
            }
        }
        if (touchedFields.detailAddress && !shippingInfo.detailAddress.trim()) {
            errors.detailAddress = '상세 주소를 입력해주세요.';
        }
        if (touchedFields.depositorName && !depositorName.trim()) {
            errors.depositorName = '입금자명을 입력해주세요.';
        }

        setFieldErrors(errors);
    }, [shippingInfo, depositorName, touchedFields]);

    const handleBlur = (fieldName: string) => {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    };

    // 최신 가격 동기화
    useEffect(() => {
        const fetchLatestPrices = async () => {
            const currentItems = useCartStore.getState().items;
            if (currentItems.length === 0) return;

            const ids = [...new Set(currentItems.map(item => item.id))];
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, price')
                    .in('id', ids);

                if (!error && data) {
                    const priceMap: Record<string, number> = {};
                    data.forEach(p => { priceMap[p.id] = p.price; });
                    useCartStore.getState().updatePrices(priceMap);
                }
            } catch (err) {
                console.error("Failed to fetch latest prices", err);
            }
        };
        fetchLatestPrices();
    }, []);

    // 인증 체크 + 회원 데이터 조회
    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, phone_number')
                        .eq('id', user.id)
                        .maybeSingle();

                    const { data: address } = await supabase
                        .from('addresses')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('is_default', true)
                        .maybeSingle();

                    const fallbackName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
                    const fallbackPhone = profile?.phone_number || user?.phone || user?.user_metadata?.phone_number || '';

                    setShippingInfo(prev => ({
                        ...prev,
                        name: fallbackName,
                        phone: fallbackPhone,
                    }));
                    setDepositorName(fallbackName);

                    if (address) {
                        setShippingInfo(prev => ({
                            ...prev,
                            zonecode: address.zonecode || '',
                            roadAddress: address.road_address || '',
                            detailAddress: address.detail_address || '',
                        }));
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuthAndLoadData();
    }, [router]);

    const isOrderCompleted = useRef(false);

    // 장바구니 비어있으면 리다이렉트
    useEffect(() => {
        if (!authLoading && items.length === 0 && !isOrderCompleted.current) {
            toast.error('장바구니가 비어있습니다.');
            router.push('/cart');
        }
    }, [items, router, authLoading]);

    // Handle Payment & Validation
    const handlePayment = async () => {
        // 모든 필드 touched 처리
        setTouchedFields({
            name: true,
            phone: true,
            detailAddress: true,
            depositorName: true,
        });

        if (!shippingInfo.name.trim()) {
            toast.error('받는 분 이름을 입력해주세요.');
            return;
        }
        if (!shippingInfo.phone.trim()) {
            toast.error('연락처를 입력해주세요.');
            return;
        }
        if (!shippingInfo.roadAddress) {
            toast.error('주소를 검색해주세요.');
            return;
        }
        if (!shippingInfo.detailAddress.trim()) {
            toast.error('상세 주소를 입력해주세요.');
            return;
        }
        if (!depositorName.trim()) {
            toast.error('입금자명을 입력해주세요.');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    items: items.map(item => ({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        quantity: item.quantity,
                        selectedColor: item.selectedColor,
                        selectedSize: item.selectedSize,
                    })),
                    shippingInfo,
                    depositorName,
                    totalAmount: getTotalPrice(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '주문 처리 중 오류가 발생했습니다.');
            }

            isOrderCompleted.current = true;
            clearCart();

            if (!user) {
                toast.success(`비회원 주문이 완료되었습니다!\n주문조회 코드: ${data.orderCode}\n꼭 기억해주세요!`, { duration: 10000 });
                router.push(`/order-lookup?code=${data.orderCode}&phone=${encodeURIComponent(shippingInfo.phone)}`);
            } else {
                toast.success('주문이 완료되었습니다!');
                router.push('/profile?tab=orders');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '결제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Daum Postcode Script Loading
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Postcode Handler
    useEffect(() => {
        if (openPostcode && window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function (data: any) {
                    setShippingInfo(prev => ({
                        ...prev,
                        zonecode: data.zonecode,
                        roadAddress: data.roadAddress,
                    }));
                    setOpenPostcode(false);
                },
                onclose: () => {
                    setOpenPostcode(false);
                }
            }).open();
        }
    }, [openPostcode]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24 px-4 sm:px-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    if (items.length === 0) return null;

    const totalPrice = getTotalPrice();

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-28 pb-24 checkout-page-wrapper">
            <div className="checkout-container">
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '32px' }}>
                    주문/결제
                </h1>

                <div className="checkout-grid">
                    {/* Left Column: 배송/입금 정보 (70%) */}
                    <div className="checkout-left" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* 배송지 정보 */}
                        <ShippingForm
                            shippingInfo={shippingInfo}
                            setShippingInfo={setShippingInfo}
                            setOpenPostcode={setOpenPostcode}
                            fieldErrors={fieldErrors}
                            onBlur={handleBlur}
                        />

                        {/* 입금 정보 섹션 (#6 톤다운) */}
                        <section className="checkout-section">
                            <h2 className="checkout-section-title">입금 정보</h2>

                            {/* 계좌 안내 — light gray, 아이콘 제거, 계좌번호만 강조 */}
                            <div className="deposit-info-box">
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    아래 계좌로 입금해주세요
                                </p>
                                <p className="account-number">
                                    {ADMIN_BANK_INFO.bankName} {ADMIN_BANK_INFO.accountNumber}
                                </p>
                                <p className="account-holder">
                                    예금주: {ADMIN_BANK_INFO.accountHolder}
                                </p>
                                <p className="trust-msg">
                                    주문 완료 후 입금해주시면, 평균 10분 이내 확인됩니다.<br />
                                    또는 <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>010-7773-1342</strong>로 연락 후 구매하실 수 있습니다.
                                </p>
                            </div>

                            {/* 입금자명 입력 */}
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    입금자명
                                </label>
                                <input
                                    type="text"
                                    required
                                    className={`checkout-input ${fieldErrors.depositorName ? 'input-error' : ''}`}
                                    placeholder="실제 입금 시 사용하는 이름"
                                    value={depositorName}
                                    onChange={e => setDepositorName(e.target.value)}
                                    onBlur={() => handleBlur('depositorName')}
                                />
                                {fieldErrors.depositorName && (
                                    <p className="checkout-input-error-msg">{fieldErrors.depositorName}</p>
                                )}
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    입금 시 사용하실 이름과 동일하게 입력해주세요.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Right: Order Summary (30%) — desktop only */}
                    <div className="checkout-right hidden lg:block">
                        <OrderSummary
                            items={items}
                            totalPrice={totalPrice}
                            isProcessing={isProcessing}
                            onPayment={handlePayment}
                        />
                    </div>
                </div>

                {/* Mobile: 주문 요약 인라인 표시 */}
                <div className="lg:hidden" style={{ marginTop: '24px' }}>
                    <OrderSummary
                        items={items}
                        totalPrice={totalPrice}
                        isProcessing={isProcessing}
                        onPayment={() => { }} // 모바일은 sticky 버튼으로 결제
                        hideCta={true}
                    />
                </div>
            </div>

            {/* Mobile: 하단 sticky 결제 버튼 (#10) */}
            <div className="checkout-mobile-sticky-btn lg:hidden">
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="checkout-cta-btn"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            처리 중...
                        </>
                    ) : (
                        `${totalPrice.toLocaleString()}원 결제하기`
                    )}
                </button>
            </div>
        </div>
    );
}
