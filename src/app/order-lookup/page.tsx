"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Check } from 'lucide-react';
import { getStatusInfo, ADMIN_BANK_INFO } from '@/lib/orderUtils';
import toast from 'react-hot-toast';
import { Order, RecoveredOrder } from '@/types/order';

export default function OrderLookupPage() {
    const [orderCode, setOrderCode] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const codeParam = params.get('code');
            const phoneParam = params.get('phone');
            if (codeParam) setOrderCode(codeParam);
            if (phoneParam) setPhone(phoneParam);
        }
    }, []);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [notFound, setNotFound] = useState(false);

    // 주문 코드 찾기 상태
    const [showForgot, setShowForgot] = useState(false);
    const [forgotName, setForgotName] = useState('');
    const [forgotPhone, setForgotPhone] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [recoveredOrders, setRecoveredOrders] = useState<RecoveredOrder[]>([]);
    const [forgotError, setForgotError] = useState('');

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotFound(false);
        setOrder(null);

        if (!orderCode.trim() || !phone.trim()) {
            toast.error('주문 코드와 전화번호를 모두 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, status, total_amount, 
                    shipping_name, shipping_phone, shipping_address, shipping_memo,
                    guest_order_code, created_at,
                    order_items (
                        id, product_id, product_title, quantity, price_at_purchase, item_option
                    )
                `)
                .eq('guest_order_code', orderCode.trim().toUpperCase())
                .eq('shipping_phone', phone.trim())
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setOrder(data as Order);
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError('');
        setRecoveredOrders([]);

        if (!forgotName.trim() || !forgotPhone.trim()) {
            setForgotError('이름과 전화번호를 모두 입력해주세요.');
            setForgotLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    guest_order_code, created_at, total_amount, status,
                    order_items (
                        product_title, quantity, price_at_purchase
                    )
                `)
                .eq('shipping_name', forgotName.trim())
                .eq('shipping_phone', forgotPhone.trim())
                .is('user_id', null)
                .order('created_at', { ascending: false });

            if (error || !data || data.length === 0) {
                setForgotError('일치하는 비회원 주문 기록을 찾을 수 없습니다.');
            } else {
                setRecoveredOrders(data as RecoveredOrder[]);
            }
        } catch {
            setForgotError('조회 중 오류가 발생했습니다.');
        } finally {
            setForgotLoading(false);
        }
    };

    const getStatusText = (status: string) => {
        const info = getStatusInfo(status);
        return { label: info.label, color: info.color };
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-white dark:bg-[#121212] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="text-center">
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">비회원 주문 조회</h1>
                    <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium tracking-wide">주문 시 발급받은 코드와 전화번호로 조회할 수 있습니다.</p>
                </div>

                {/* 조회 폼 */}
                <form onSubmit={handleLookup} className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="relative group">
                            <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">주문 조회 코드</label>
                            <input
                                type="text"
                                required
                                maxLength={8}
                                className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white text-center text-2xl font-black tracking-[0.3em] uppercase focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                placeholder="XXXXXXXX"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="relative group">
                            <label className="block text-[15px] font-bold text-gray-800 dark:text-gray-200 mb-3 ml-1 tracking-wide">주문 시 입력한 전화번호</label>
                            <input
                                type="tel"
                                required
                                className="block w-full h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white text-base px-5 focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                placeholder="010-0000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[17px] font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-xl hover:scale-[1.01] disabled:opacity-50 mt-2"
                    >
                        {loading ? '조회 중...' : '주문 조회하기'}
                    </button>
                </form>

                {/* 주문 코드 찾기 토글 */}
                <div className="flex flex-col items-center mt-6">
                    <button
                        onClick={() => {
                            setShowForgot(!showForgot);
                            setForgotError('');
                            setRecoveredOrders([]);
                        }}
                        className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide hover:text-black dark:hover:text-white hover:underline underline-offset-4 transition-all mb-4"
                    >
                        주문 코드를 잊으셨나요?
                    </button>

                    {showForgot && (
                        <form onSubmit={handleForgotLookup} className="w-full bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 animate-fadeIn shadow-sm" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="relative group">
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 ml-1">받는 분 이름</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full h-12 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white text-sm px-4 focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                    placeholder="홍길동"
                                    value={forgotName}
                                    onChange={(e) => setForgotName(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 ml-1">주문 시 연락처</label>
                                <input
                                    type="tel"
                                    required
                                    className="block w-full h-12 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white text-sm px-4 focus:border-black dark:focus:border-gray-500 focus:ring-0 focus:bg-white dark:focus:bg-[#222] transition-all outline-none"
                                    placeholder="010-0000-0000"
                                    value={forgotPhone}
                                    onChange={(e) => setForgotPhone(e.target.value)}
                                />
                            </div>

                            {forgotError && (
                                <p className="text-red-500 text-sm text-center font-bold mt-2">{forgotError}</p>
                            )}

                            {recoveredOrders.length > 0 && (
                                <div className="mt-2 flex flex-col gap-3">
                                    <div className="bg-green-50 dark:bg-green-900/20 border justify-center border-green-200 dark:border-green-800 p-3 rounded-xl text-center mb-1">
                                        <p className="text-green-700 dark:text-green-400 text-sm font-bold">
                                            총 {recoveredOrders.length}건의 주문 내역을 찾았습니다.
                                        </p>
                                    </div>
                                    {recoveredOrders.map((ro) => (
                                        <div key={ro.guest_order_code} className="bg-white dark:bg-[#222] border-[1.5px] border-gray-100 dark:border-gray-800 p-4 rounded-xl text-left relative hover:border-black dark:hover:border-gray-500 transition-colors group shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-black text-gray-900 dark:text-white tracking-[0.1em] text-lg">{ro.guest_order_code}</p>
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${getStatusText(ro.status).color}`}>
                                                    {getStatusText(ro.status).label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                                                {new Date(ro.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            <div className="mb-4 flex flex-col gap-1">
                                                {ro.order_items?.map((item: any, idx: number) => (
                                                    <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate flex items-center gap-1.5">
                                                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full inline-block"></span>
                                                        {item.product_title}
                                                        <span className="text-gray-400 dark:text-gray-500 text-xs text-opacity-80 ml-0.5">({item.quantity}개)</span>
                                                    </p>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                                                <span className="text-[15px] font-black text-gray-900 dark:text-white">{ro.total_amount?.toLocaleString()}원</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOrderCode(ro.guest_order_code || '');
                                                        setPhone(forgotPhone.trim());
                                                        // 부드럽게 위로 올려주고, 위쪽 form에 값을 세팅함으로써 조회 유도
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-100 dark:bg-[#333] text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-black hover:text-white dark:hover:bg-gray-100 dark:hover:text-black transition-colors"
                                                >
                                                    상세 내역 보기
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={forgotLoading}
                                className="w-full h-12 bg-gray-900 dark:bg-gray-100 text-white dark:text-black font-bold rounded-xl mt-4 hover:bg-gray-800 dark:hover:bg-white transition-all disabled:opacity-50"
                            >
                                {forgotLoading ? '찾는 중...' : '내 주문 코드 찾기'}
                            </button>
                        </form>
                    )}
                </div>

                {/* 조회 결과 없음 */}
                {notFound && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center animate-fade-in-down">
                        <p className="text-red-700 dark:text-red-400 font-bold mb-1">주문을 찾을 수 없습니다.</p>
                        <p className="text-red-600/80 dark:text-red-400/80 text-sm font-medium">주문 코드와 전화번호를 다시 확인해주세요.</p>
                    </div>
                )}

                {/* 조회 결과 */}
                {order && (
                    <div className="mt-8 animate-fade-in-down w-full max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 입금 안내 정보 창 (입금 대기 중이거나 주문 확인 중일 때 표시) */}
                        {(order.status === 'pending_payment' || order.status === 'payment_confirming') && (
                            <div className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 p-6 sm:p-8 rounded-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center flex-shrink-0">
                                        <CreditCard className="w-4 h-4 text-[var(--primary-color)]" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-wide">입금 안내</h2>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">아래 계좌로 결제 금액을 입금해주셔야 주문 확인 및 배송 절차가 진행됩니다.</p>
                                <div className="bg-white dark:bg-[#121212] p-5 rounded-xl border border-gray-100 dark:border-gray-800" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">입금 은행</span>
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{ADMIN_BANK_INFO.bankName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">계좌 번호</span>
                                        <span className="font-bold text-gray-900 dark:text-white text-sm tracking-wider">{ADMIN_BANK_INFO.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">예금주</span>
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{ADMIN_BANK_INFO.accountHolder}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 mt-1 border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">입금하실 금액</span>
                                        <span className="font-black text-xl text-[var(--primary-color)]">{order.total_amount?.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 결제 완료(관리자 확인) 안내 창 */}
                        {order.status === 'paid' && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-6 sm:p-8 rounded-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-400 tracking-wide">주문 확인 완료</h2>
                                </div>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                                    고객님의 입금 내역 및 주문을 <span className="font-bold">관리자가 정상적으로 확인</span>하였습니다.<br />
                                    현재 상품을 꼼꼼히 준비 중이며, 준비가 완료되는 대로 빠르게 배송해 드리겠습니다.
                                </p>
                            </div>
                        )}

                        {/* 주문 상세 */}
                        <div className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-wide">주문 상세</h2>
                                <span className={`px-4 py-2 rounded-full text-xs font-bold leading-normal ${getStatusText(order.status).color}`}>
                                    {getStatusText(order.status).label}
                                </span>
                            </div>
                            <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-[#121212] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">주문 코드</span>
                                    <span className="font-black text-gray-900 dark:text-white tracking-[0.2em] text-base">{order.guest_order_code}</span>
                                </div>
                                <div className="flex justify-between items-center px-2 py-2">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">주문 일시</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex justify-between items-center px-2 py-2">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium">총 결제 금액</span>
                                    <span className="font-black text-lg text-[var(--primary-color)]">{order.total_amount?.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>

                        {/* 배송지 정보 */}
                        <div className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 tracking-wide">배송지 정보</h2>
                            <div className="text-sm px-1" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">받는 분</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{order.shipping_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0">연락처</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{order.shipping_phone}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0 pt-0.5">주소</span>
                                    <span className="text-gray-900 dark:text-white font-medium text-right max-w-[70%] leading-7 break-keep">{order.shipping_address}</span>
                                </div>
                                {order.shipping_memo && (
                                    <div className="flex justify-between items-start mt-2 pt-4 border-t border-gray-100 dark:border-gray-800 border-dashed">
                                        <span className="text-gray-400 dark:text-gray-500 font-medium flex-shrink-0 pt-0.5">배송 메모</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium text-right max-w-[70%] leading-7">{order.shipping_memo}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 주문 상품 */}
                        <div className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 tracking-wide">주문 상품</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-4 px-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">{item.product_title || '상품'}</p>
                                            <div className="flex gap-1.5">
                                                {item.item_option?.color && <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">{item.item_option.color}</span>}
                                                {item.item_option?.size && <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">{item.item_option.size}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right pl-4">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.price_at_purchase?.toLocaleString()}원</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">{item.quantity}개</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
