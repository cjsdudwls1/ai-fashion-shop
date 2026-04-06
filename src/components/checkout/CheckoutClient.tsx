"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const DaumPostcode = dynamic(() => import('react-daum-postcode'), {
    loading: () => <div style={{ height: '450px', background: 'var(--bg-elevated)' }} className="animate-shimmer" />,
    ssr: false,
});
import { useCartStore } from '@/store/cartStore';
import ShippingForm from '@/components/checkout/ShippingForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import DepositInfo from '@/components/checkout/DepositInfo';
import { getShippingFee } from '@/lib/orderUtils';
import toast from 'react-hot-toast';
import { syncLatestPrices } from '@/services/priceService';
import { useCheckoutAuth } from '@/hooks/useCheckoutAuth';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import * as PortOne from '@portone/browser-sdk/v2';
import PaymentMethodSelector, { PaymentMethodType } from '@/components/checkout/PaymentMethodSelector';
import { PORTONE_STORE_ID, PORTONE_CHANNEL_KEY, isCardPaymentAvailable } from '@/lib/portone';

export default function CheckoutClient() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();

    const { user, authLoading, defaultShipping } = useCheckoutAuth();
    const {
        shippingInfo,
        setShippingInfo,
        depositorName,
        setDepositorName,
        fieldErrors,
        handleBlur,
        markAllTouched,
        isValid,
        openPostcode,
        setOpenPostcode,
        handleCompletePostcode,
    } = useCheckoutForm(defaultShipping);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bank_transfer');
    const isOrderCompleted = useRef(false);

    // 최신 가격 동기화
    useEffect(() => {
        let ignore = false;
        syncLatestPrices(ignore);
        return () => { ignore = true; };
    }, []);

    // 장바구니 비어있으면 리다이렉트
    useEffect(() => {
        if (!authLoading && items.length === 0 && !isOrderCompleted.current) {
            toast.error('장바구니가 비어있습니다.');
            router.push('/cart');
        }
    }, [items, router, authLoading]);

    // Handle Payment & Validation
    const handlePayment = async () => {
        markAllTouched();

        if (!isValid()) {
            if (!shippingInfo.name.trim()) toast.error('받는 분 이름을 입력해주세요.');
            else if (!shippingInfo.phone.trim()) toast.error('연락처를 입력해주세요.');
            else if (!shippingInfo.roadAddress) toast.error('주소를 검색해주세요.');
            else if (!shippingInfo.detailAddress.trim()) toast.error('상세 주소를 입력해주세요.');
            else if (paymentMethod === 'bank_transfer' && !depositorName.trim()) toast.error('입금자명을 입력해주세요.');
            return;
        }

        setIsProcessing(true);
        try {
            const totalAmount = getTotalPrice() + getShippingFee(getTotalPrice());
            const itemsPayload = items.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
            }));

            if (paymentMethod === 'bank_transfer') {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id,
                        items: itemsPayload,
                        shippingInfo,
                        depositorName,
                        totalAmount,
                        paymentMethod: 'bank_transfer',
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || '주문 처리 중 오류가 발생했습니다.');
                }

                finishOrder(data.orderCode);
            } else {
                // PG 결제 (카드/간편결제)
                if (!isCardPaymentAvailable()) {
                    throw new Error('현재 카드/간편결제 준비 중입니다. 무통장입금을 이용해주세요.');
                }

                const prepareResponse = await fetch('/api/payments/prepare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id,
                        items: itemsPayload,
                        shippingInfo,
                        totalAmount,
                        depositorName: '',
                    })
                });

                const prepareData = await prepareResponse.json();

                if (!prepareResponse.ok) {
                    throw new Error(prepareData.error || '결제 준비 중 오류가 발생했습니다.');
                }

                const { paymentId, orderId, orderCode } = prepareData;

                const paymentResponse = await PortOne.requestPayment({
                    storeId: PORTONE_STORE_ID,
                    channelKey: PORTONE_CHANNEL_KEY,
                    paymentId,
                    orderName: items.length > 1 ? `${items[0].title} 외 ${items.length - 1}건` : items[0].title,
                    totalAmount,
                    currency: 'CURRENCY_KRW',
                    payMethod: 'CARD',
                    customer: {
                        fullName: shippingInfo.name,
                        phoneNumber: shippingInfo.phone,
                    }
                });

                if (paymentResponse?.code != null) {
                    // 결제 취소 또는 실패
                    throw new Error(paymentResponse.message || '결제가 취소되었거나 실패했습니다.');
                }

                // 사후 검증
                const verifyResponse = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId, orderId })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok) {
                    throw new Error(verifyData.error || '결제 검증 오류가 발생했습니다.');
                }

                finishOrder(orderCode);
            }
        } catch (error: unknown) {
            console.error(error);
            const errMsg = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.';
            toast.error(errMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const finishOrder = (orderCode: string) => {
        isOrderCompleted.current = true;
        clearCart();

        if (!user) {
            toast.success(`비회원 주문이 완료되었습니다!\n주문조회 코드: ${orderCode}\n꼭 기억해주세요!`, { duration: 10000 });
            router.push(`/order-lookup?code=${orderCode}&phone=${encodeURIComponent(shippingInfo.phone)}`);
        } else {
            toast.success('주문이 완료되었습니다!');
            router.push('/profile?tab=orders');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24 px-4 sm:px-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    if (items.length === 0) return null;

    const totalPrice = getTotalPrice();
    const shippingFee = getShippingFee(totalPrice);
    const finalPrice = totalPrice + shippingFee;

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-28 checkout-page-wrapper" style={{ paddingBottom: '160px' }}>
            <div className="checkout-container">
                <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-8">
                    주문/결제
                </h1>

                <div className="checkout-grid">
                    {/* Left Column: 배송/입금 정보 (70%) */}
                    <div className="checkout-left flex flex-col gap-6">
                        {/* 배송지 정보 */}
                        <ShippingForm
                            shippingInfo={shippingInfo}
                            setShippingInfo={setShippingInfo}
                            setOpenPostcode={setOpenPostcode}
                            fieldErrors={fieldErrors}
                            onBlur={handleBlur}
                        />

                        {/* 결제 수단 섹션 */}
                        <PaymentMethodSelector 
                            selectedMethod={paymentMethod}
                            onMethodSelect={setPaymentMethod}
                        />

                        {/* 입금 정보 섹션 (무통장 입금 시에만 렌더링) */}
                        {paymentMethod === 'bank_transfer' && (
                            <DepositInfo
                                depositorName={depositorName}
                                setDepositorName={setDepositorName}
                                error={fieldErrors.depositorName}
                                onBlur={() => handleBlur('depositorName')}
                            />
                        )}
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
                <div className="lg:hidden mt-6">
                    <OrderSummary
                        items={items}
                        totalPrice={totalPrice}
                        isProcessing={isProcessing}
                        onPayment={() => { }} // 모바일은 sticky 버튼으로 결제
                        hideCta={true}
                    />
                </div>
            </div>

            {/* Mobile: 하단 sticky 결제 버튼 */}
            <div className="checkout-mobile-sticky-btn lg:hidden">
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="checkout-cta-btn"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5 text-white inline-block mr-2" />
                            처리 중...
                        </>
                    ) : (
                        `${finalPrice.toLocaleString()}원 결제하기`
                    )}
                </button>
            </div>

            {/* Daum Postcode 모달 */}
            {openPostcode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-[var(--bg-elevated)] w-full max-w-lg rounded-[var(--radius-lg)] shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">주소 검색</h3>
                            <button
                                onClick={() => setOpenPostcode(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
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
