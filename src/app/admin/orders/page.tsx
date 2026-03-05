'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStatusInfo, ORDER_STATUS_MAP, OrderStatus } from '@/lib/orderUtils';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build'
);

interface OrderItem {
    id: string;
    product_id: string;
    product_title: string;
    quantity: number;
    price_at_purchase: number;
    item_option: { color?: string; size?: string };
}

interface Order {
    id: string;
    user_id: string | null;
    status: string;
    total_amount: number;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_memo: string | null;
    depositor_name: string | null;
    guest_order_code: string | null;
    created_at: string;
    updated_at: string;
    order_items?: OrderItem[];
}

interface StatusChangeLog {
    from: string;
    to: string;
    changedAt: string;
    changedBy: string;
}

const STATUS_FILTERS: { key: string; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'payment_confirming', label: '주문확인중' },
    { key: 'paid', label: '결제 완료' },
    { key: 'shipped', label: '배송 중' },
    { key: 'delivered', label: '배송 완료' },
    { key: 'cancelled', label: '취소' },
];

// 상태 변경 가능한 다음 상태 목록 (드롭다운용)
const NEXT_STATUS_MAP: Record<string, { value: string; label: string; type: 'normal' | 'danger' | 'revert' }[]> = {
    pending_payment: [
        { value: 'payment_confirming', label: '주문 확인(입금 대기 완료)', type: 'normal' },
        { value: 'cancelled', label: '주문 취소', type: 'danger' },
    ],
    payment_confirming: [
        { value: 'paid', label: '결제 완료(입금 확인)', type: 'normal' },
        { value: 'pending_payment', label: '되돌리기 (입금 대기)', type: 'revert' },
        { value: 'cancelled', label: '주문 취소', type: 'danger' },
    ],
    paid: [
        { value: 'shipped', label: '배송 시작', type: 'normal' },
        { value: 'payment_confirming', label: '되돌리기 (주문확인중)', type: 'revert' },
        { value: 'cancelled', label: '주문 취소', type: 'danger' },
    ],
    shipped: [
        { value: 'delivered', label: '배송 완료', type: 'normal' },
        { value: 'paid', label: '되돌리기 (결제 완료)', type: 'revert' },
        { value: 'cancelled', label: '주문 취소', type: 'danger' },
    ],
    delivered: [
        { value: 'shipped', label: '되돌리기 (배송 중)', type: 'revert' },
    ],
    cancelled: [
        { value: 'pending_payment', label: '취소 철회 (입금대기로 변경)', type: 'revert' },
    ],
};

// Confirm Modal 컴포넌트
function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel,
    isDanger,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-3 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-3 text-lg font-bold rounded-xl text-white transition-colors ${isDanger
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]); // 필터 카운트용 전체 주문
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Confirm Modal 상태
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        orderId: string;
        newStatus: string;
        title: string;
        message: string;
        confirmLabel: string;
        isDanger: boolean;
    }>({
        isOpen: false,
        orderId: '',
        newStatus: '',
        title: '',
        message: '',
        confirmLabel: '',
        isDanger: false,
    });

    // 상태 변경 로그 (프론트엔드 세션 내)
    const [statusLogs, setStatusLogs] = useState<Record<string, StatusChangeLog[]>>({});

    const filterRef = useRef<HTMLDivElement>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // 전체 주문을 먼저 가져와서 카운트에 사용
            const allResponse = await fetch('/api/orders');
            if (!allResponse.ok) throw new Error('주문 목록을 불러오는데 실패했습니다.');
            const allData = await allResponse.json();
            setAllOrders(allData || []);

            if (activeFilter === 'all') {
                setOrders(allData || []);
            } else {
                const filtered = (allData || []).filter((o: Order) => o.status === activeFilter);
                setOrders(filtered);
            }
        } catch (err: any) {
            console.error('Orders fetch error:', err);
            toast.error(err.message || '주문 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // 상태 변경 전 confirm modal 표시
    const requestStatusChange = (orderId: string, newStatus: string) => {
        const statusLabel = getStatusInfo(newStatus).label;
        const isDanger = newStatus === 'cancelled';

        setConfirmModal({
            isOpen: true,
            orderId,
            newStatus,
            title: isDanger ? '주문 취소 확인' : '상태 변경 확인',
            message: isDanger
                ? `이 주문을 취소 처리하시겠습니까?\n이 작업은 되돌릴 수 있지만, 고객에게 통보될 수 있습니다.`
                : `주문 상태를 "${statusLabel}"(으)로 변경하시겠습니까?`,
            confirmLabel: isDanger ? '주문 취소' : '변경',
            isDanger,
        });
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setUpdatingOrderId(orderId);

        const currentOrder = orders.find(o => o.id === orderId);
        const oldStatus = currentOrder?.status || '';

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '상태 변경 실패');
            }

            // 변경 로그 기록
            setStatusLogs(prev => ({
                ...prev,
                [orderId]: [
                    ...(prev[orderId] || []),
                    {
                        from: oldStatus,
                        to: newStatus,
                        changedAt: new Date().toISOString(),
                        changedBy: '관리자',
                    },
                ],
            }));

            toast.success(`주문 상태가 "${getStatusInfo(newStatus).label}"(으)로 변경되었습니다.`);
            fetchOrders();
        } catch (error: any) {
            toast.error(error.message || '상태 변경에 실패했습니다.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(prev => prev === orderId ? null : orderId);
    };

    // 필터별 카운트 (전체 주문 기준)
    const getFilterCount = (filterKey: string) => {
        if (filterKey === 'all') return allOrders.length;
        return allOrders.filter(o => o.status === filterKey).length;
    };

    // 전체 합계
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return (
        <div style={{ background: 'var(--bg-elevated)', minHeight: '100vh' }}>
            {/* ─── Confirm Modal ─── */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                isDanger={confirmModal.isDanger}
                onConfirm={() => handleStatusChange(confirmModal.orderId, confirmModal.newStatus)}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* ─── 콘텐츠 영역 ─── */}
            <div className="admin-orders-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 24px 120px' }}>

                {/* ━━━ Header ━━━ */}
                <div className="admin-orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 className="admin-orders-title" style={{ fontSize: '33px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        주문 관리
                    </h1>
                    <div className="admin-orders-header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* 전체 총액 */}
                        {orders.length > 0 && (
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '18px', color: 'var(--text-muted)', display: 'block' }}>총 {orders.length}건</span>
                                <span className="admin-orders-total-amount" style={{ fontSize: '27px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalAmount.toLocaleString()}원</span>
                            </div>
                        )}
                        <button
                            onClick={fetchOrders}
                            className="admin-refresh-btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '12px 20px', fontSize: '20px', fontWeight: 600,
                                borderRadius: '10px', border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            새로고침
                        </button>
                    </div>
                </div>

                {/* ━━━ Filter Tabs (Sticky) ━━━ */}
                <div
                    ref={filterRef}
                    style={{
                        position: 'sticky', top: '80px', zIndex: 30,
                        background: 'var(--bg-elevated)',
                        paddingBottom: '16px', paddingTop: '4px',
                        marginBottom: '16px',
                        borderBottom: '1px solid var(--border-color)',
                    }}
                >
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                        {STATUS_FILTERS.map(filter => {
                            const count = getFilterCount(filter.key);
                            const isActive = activeFilter === filter.key;
                            return (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key)}
                                    className="admin-filter-btn"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        fontSize: '21px',
                                        fontWeight: isActive ? 700 : 500,
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: isActive ? '2px solid #4F46E5' : '1px solid var(--border-color)',
                                        background: isActive ? '#4F46E5' : 'var(--bg-card)',
                                        color: isActive ? '#fff' : 'var(--text-secondary)',
                                        boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                                    }}
                                >
                                    {filter.label}
                                    <span className="admin-filter-count" style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        minWidth: '28px', height: '28px',
                                        padding: '0 6px',
                                        borderRadius: '6px',
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                                        color: isActive ? '#fff' : 'var(--text-muted)',
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ━━━ Orders List ━━━ */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                        <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#4F46E5' }} />
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 0',
                        background: 'var(--bg-card)', borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <svg width="48" height="48" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p style={{ color: 'var(--text-muted)', fontSize: '21px' }}>해당 상태의 주문이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--border-color)' }}>
                        {orders.map((order, index) => {
                            const statusInfo = getStatusInfo(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            const isUpdating = updatingOrderId === order.id;
                            const logs = statusLogs[order.id] || [];

                            return (
                                <div key={order.id} style={{ background: 'var(--bg-card)' }}>
                                    {/* ── Order Row ── */}
                                    <div
                                        onClick={() => toggleExpand(order.id)}
                                        className="admin-order-row"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '20px 24px',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            gap: '16px',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Left: 아이콘 + 주문자 중심 정보 */}
                                        <div className="admin-order-row-left" style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                            {/* 펼침 아이콘 */}
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: 'var(--bg-elevated)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'transform 0.2s',
                                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                            }}>
                                                <svg width="18" height="18" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                            </div>

                                            {/* 주문자명 (가장 눈에 띄게) */}
                                            <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                                                {order.shipping_name}
                                            </span>

                                            {/* 입금자명 (주문자와 다를 경우만 표시) */}
                                            {order.depositor_name && order.depositor_name !== order.shipping_name && (
                                                <span style={{ fontSize: '16px', color: '#F59E0B', fontWeight: 600, flexShrink: 0 }}>
                                                    (입금자명: {order.depositor_name})
                                                </span>
                                            )}

                                            {/* 상태 뱃지 */}
                                            <span className={`${statusInfo.color}`} style={{
                                                display: 'inline-flex', alignItems: 'center',
                                                padding: '6px 14px', borderRadius: '8px',
                                                fontSize: '18px', fontWeight: 600,
                                                flexShrink: 0,
                                            }}>
                                                {statusInfo.label}
                                            </span>

                                            {/* 주문번호 (보조 정보로 축소) */}
                                            <span className="admin-order-number" style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0, letterSpacing: '0.03em' }}>
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>주문번호</span> #{order.guest_order_code || order.id.slice(0, 8)}
                                            </span>

                                            {/* 날짜 */}
                                            <span style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0, display: 'none' }} className="sm-show">
                                                {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        {/* Right: 날짜(모바일) + 금액 */}
                                        <div className="admin-order-row-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '16px', color: 'var(--text-muted)', display: 'block' }} className="sm-hide-inline">
                                                {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {order.total_amount?.toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── Expanded Detail Panel ── */}
                                    {isExpanded && (
                                        <div style={{
                                            borderTop: '1px solid var(--border-color)',
                                            padding: '24px 20px',
                                            background: 'var(--bg-elevated)',
                                            animation: 'slideDown 0.2s ease-out',
                                        }}>
                                            {/* 2단 레이아웃 (좌측: 고객/배송, 우측: 상품/금액/상태변경) */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="admin-detail-grid">

                                                {/* ▍좌측 패널: 고객 정보 + 배송 정보 */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                                    {/* 고객 정보 */}
                                                    <div style={{
                                                        background: 'var(--bg-card)', borderRadius: '12px',
                                                        border: '1px solid var(--border-color)', padding: '16px',
                                                    }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                                            고객 정보
                                                        </h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>유형</span>
                                                                {order.user_id ? (
                                                                    <span style={{ fontSize: '20px', color: '#3B82F6', fontWeight: 600 }}>회원</span>
                                                                ) : (
                                                                    <span style={{ fontSize: '20px', color: 'var(--text-muted)', fontWeight: 500, padding: '3px 10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>비회원</span>
                                                                )}
                                                            </div>
                                                            {order.depositor_name && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>입금자명</span>
                                                                    <span style={{ fontSize: '20px', color: '#F59E0B', fontWeight: 600 }}>{order.depositor_name}</span>
                                                                </div>
                                                            )}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>주문번호</span>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '0.03em' }}>
                                                                    #{order.guest_order_code || order.id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>주문일시</span>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>
                                                                    {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                                                        year: 'numeric', month: 'long', day: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 배송 정보 */}
                                                    <div style={{
                                                        background: 'var(--bg-card)', borderRadius: '12px',
                                                        border: '1px solid var(--border-color)', padding: '16px',
                                                    }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                                            배송 정보
                                                        </h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <InfoRow label="받는 분" value={order.shipping_name} />
                                                            <InfoRow label="연락처" value={order.shipping_phone} />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0 }}>주소</span>
                                                                <span style={{ fontSize: '20px', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '65%', lineHeight: 1.5 }}>{order.shipping_address}</span>
                                                            </div>
                                                            {order.shipping_memo && (
                                                                <InfoRow label="배송메모" value={order.shipping_memo} />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 변경 로그 (요구사항 #10) */}
                                                    {logs.length > 0 && (
                                                        <div style={{
                                                            background: 'var(--bg-card)', borderRadius: '12px',
                                                            border: '1px solid var(--border-color)', padding: '16px',
                                                        }}>
                                                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                                                변경 이력
                                                            </h3>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {logs.map((log, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                                                                            {new Date(log.changedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>{log.changedBy}</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>:</span>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>{getStatusInfo(log.from).label}</span>
                                                                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getStatusInfo(log.to).label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ▍우측 패널: 주문 상품 + 금액 요약 + 상태 변경 */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                                    {/* 주문 상품 */}
                                                    <div style={{
                                                        background: 'var(--bg-card)', borderRadius: '12px',
                                                        border: '1px solid var(--border-color)', padding: '16px',
                                                    }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                                            주문 상품
                                                        </h3>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                                            {order.order_items?.map((item, idx) => (
                                                                <div key={item.id} style={{
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                    padding: '10px 0',
                                                                    borderBottom: idx < (order.order_items?.length || 0) - 1 ? '1px solid var(--border-color)' : 'none',
                                                                }}>
                                                                    <div>
                                                                        <span style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.product_title}</span>
                                                                        <div style={{ fontSize: '18px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '8px' }}>
                                                                            {item.item_option?.color && <span>{item.item_option.color}</span>}
                                                                            {item.item_option?.size && <span>{item.item_option.size}</span>}
                                                                            <span>x{item.quantity}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                                                                        {(item.price_at_purchase * item.quantity).toLocaleString()}원
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* 금액 요약 */}
                                                        <div style={{
                                                            marginTop: '12px', paddingTop: '12px',
                                                            borderTop: '2px solid var(--border-color)',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        }}>
                                                            <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)' }}>합계</span>
                                                            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {order.total_amount?.toLocaleString()}원
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 상태 변경 (드롭다운 방식) */}
                                                    <div style={{
                                                        background: 'var(--bg-card)', borderRadius: '12px',
                                                        border: '1px solid var(--border-color)', padding: '16px',
                                                    }}>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                                            상태 변경
                                                        </h3>

                                                        {/* 현재 상태 (read-only badge) */}
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <span style={{ fontSize: '18px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>현재 상태</span>
                                                            <span className={`${statusInfo.color}`} style={{
                                                                display: 'inline-flex', alignItems: 'center',
                                                                padding: '8px 18px', borderRadius: '10px',
                                                                fontSize: '20px', fontWeight: 700,
                                                            }}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>

                                                        {/* 상태 변경 버튼들 */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {(NEXT_STATUS_MAP[order.status] || []).map(option => {
                                                                let btnStyle: React.CSSProperties = {};
                                                                if (option.type === 'normal') {
                                                                    btnStyle = {
                                                                        background: '#4F46E5', color: '#fff',
                                                                        border: 'none', fontWeight: 700,
                                                                    };
                                                                } else if (option.type === 'danger') {
                                                                    btnStyle = {
                                                                        background: 'transparent', color: '#EF4444',
                                                                        border: '1px solid #FCA5A5',
                                                                        fontWeight: 600,
                                                                    };
                                                                } else {
                                                                    btnStyle = {
                                                                        background: 'transparent', color: 'var(--text-secondary)',
                                                                        border: '1px solid var(--border-color)',
                                                                        fontWeight: 500,
                                                                    };
                                                                }

                                                                return (
                                                                    <button
                                                                        key={option.value}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            requestStatusChange(order.id, option.value);
                                                                        }}
                                                                        disabled={isUpdating}
                                                                        style={{
                                                                            ...btnStyle,
                                                                            padding: '14px 20px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '20px',
                                                                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                                            opacity: isUpdating ? 0.5 : 1,
                                                                            transition: 'all 0.15s',
                                                                            textAlign: 'left',
                                                                        }}
                                                                    >
                                                                        {isUpdating ? '처리중...' : option.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Responsive & Animation Styles ─── */}
            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    .admin-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (min-width: 640px) {
                    .sm-show { display: inline !important; }
                    .sm-hide-inline { display: none !important; }
                }
                @media (max-width: 639px) {
                    .sm-show { display: none !important; }
                    .sm-hide-inline { display: inline !important; }
                }
                @media (max-width: 767px) {
                    .admin-orders-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                    .admin-orders-header-right {
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .admin-order-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        padding: 16px !important;
                        gap: 10px !important;
                    }
                    .admin-order-row-left {
                        flex-wrap: wrap !important;
                        gap: 8px !important;
                    }
                    .admin-order-row-right {
                        width: 100% !important;
                        justify-content: space-between !important;
                        padding-top: 8px !important;
                        border-top: 1px solid var(--border-color) !important;
                    }
                    .admin-order-number {
                        display: none !important;
                    }
                    .admin-filter-btn {
                        padding: 8px 12px !important;
                        font-size: 15px !important;
                    }
                    .admin-filter-count {
                        min-width: 22px !important;
                        height: 22px !important;
                        font-size: 13px !important;
                    }
                    .admin-orders-title {
                        font-size: 24px !important;
                    }
                    .admin-orders-total-amount {
                        font-size: 20px !important;
                    }
                    .admin-orders-content {
                        padding: 40px 16px 80px !important;
                    }
                    .admin-refresh-btn {
                        padding: 10px 14px !important;
                        font-size: 15px !important;
                    }
                }
            `}</style>
        </div>
    );
}

// 헬퍼: 정보 행
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}
