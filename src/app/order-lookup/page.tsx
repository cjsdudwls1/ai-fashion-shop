"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface OrderData {
    id: string;
    status: string;
    total_amount: number;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_memo: string;
    guest_order_code: string;
    created_at: string;
    order_items: {
        id: string;
        product_id: string;
        product_title: string;
        quantity: number;
        price_at_purchase: number;
        item_option: { color?: string; size?: string };
    }[];
}

export default function OrderLookupPage() {
    const [orderCode, setOrderCode] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderData | null>(null);
    const [notFound, setNotFound] = useState(false);

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
                .eq('guest_phone', phone.trim())
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setOrder(data as OrderData);
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
            paid: { label: '결제 완료', color: 'bg-green-500/15 text-green-400' },
            pending: { label: '결제 대기', color: 'bg-yellow-500/15 text-yellow-400' },
            shipped: { label: '배송 중', color: 'bg-blue-500/15 text-blue-400' },
            delivered: { label: '배송 완료', color: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]' },
            cancelled: { label: '주문 취소', color: 'bg-red-500/15 text-red-400' },
        };
        return map[status] || { label: status, color: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]' };
    };

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-24">
            <div className="container-main">
                <div className="max-w-lg mx-auto">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">비회원 주문 조회</h1>
                    <p className="text-[var(--text-secondary)] mb-8">주문 시 발급받은 코드와 전화번호로 조회할 수 있습니다.</p>

                    {/* 조회 폼 */}
                    <form onSubmit={handleLookup} className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] mb-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">주문 조회 코드</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={8}
                                    className="w-full h-14 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-center text-2xl font-black tracking-[0.3em] uppercase focus:border-[var(--text-primary)] focus:ring-0 focus:bg-[var(--bg-card)] transition-all outline-none"
                                    placeholder="XXXXXXXX"
                                    value={orderCode}
                                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">주문 시 입력한 전화번호</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full h-14 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-base px-5 focus:border-[var(--text-primary)] focus:ring-0 focus:bg-[var(--bg-card)] transition-all outline-none"
                                    placeholder="010-0000-0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-[var(--text-primary)] text-[var(--bg-dark)] font-bold rounded-2xl mt-6 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? '조회 중...' : '주문 조회하기'}
                        </button>
                    </form>

                    {/* 조회 결과 없음 */}
                    {notFound && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                            <p className="text-red-400 font-bold mb-1">주문을 찾을 수 없습니다.</p>
                            <p className="text-red-400/80 text-sm">주문 코드와 전화번호를 다시 확인해주세요.</p>
                        </div>
                    )}

                    {/* 조회 결과 */}
                    {order && (
                        <div className="space-y-4">
                            {/* 주문 상태 */}
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-[var(--text-primary)]">주문 상세</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusText(order.status).color}`}>
                                        {getStatusText(order.status).label}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">주문 코드</span>
                                        <span className="font-bold text-[var(--text-primary)] tracking-wider">{order.guest_order_code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">주문 일시</span>
                                        <span className="text-[var(--text-primary)]">{new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">총 결제 금액</span>
                                        <span className="font-bold text-indigo-500">{order.total_amount?.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>

                            {/* 배송지 정보 */}
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">배송지 정보</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">받는 분</span>
                                        <span className="text-[var(--text-primary)]">{order.shipping_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">연락처</span>
                                        <span className="text-[var(--text-primary)]">{order.shipping_phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-secondary)]">주소</span>
                                        <span className="text-[var(--text-primary)] text-right max-w-[60%]">{order.shipping_address}</span>
                                    </div>
                                    {order.shipping_memo && (
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">배송 메모</span>
                                            <span className="text-[var(--text-primary)]">{order.shipping_memo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 주문 상품 */}
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">주문 상품</h2>
                                <div className="space-y-3">
                                    {order.order_items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-[var(--border-color)] last:border-0">
                                            <div>
                                                <p className="font-medium text-[var(--text-primary)] text-sm">{item.product_title || '상품'}</p>
                                                <div className="text-xs text-[var(--text-secondary)] space-x-1 mt-1">
                                                    {item.item_option?.color && <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{item.item_option.color}</span>}
                                                    {item.item_option?.size && <span className="bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{item.item_option.size}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{item.price_at_purchase?.toLocaleString()}원</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{item.quantity}개</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
