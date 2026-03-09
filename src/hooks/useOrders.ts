'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStatusInfo } from '@/lib/orderUtils';
import toast from 'react-hot-toast';
import { Order, StatusChangeLog } from '@/types/order';

// 상태 필터
export const STATUS_FILTERS: { key: string; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'payment_confirming', label: '주문확인중' },
    { key: 'paid', label: '결제 완료' },
    { key: 'shipped', label: '배송 중' },
    { key: 'delivered', label: '배송 완료' },
    { key: 'cancelled', label: '취소' },
];

// 상태 변경 가능한 다음 상태 목록
export interface NextStatusOption {
    value: string;
    label: string;
    type: 'normal' | 'danger' | 'revert';
}

export const NEXT_STATUS_MAP: Record<string, NextStatusOption[]> = {
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

export interface ConfirmModalState {
    isOpen: boolean;
    orderId: string;
    newStatus: string;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger: boolean;
}

export interface UseOrdersReturn {
    orders: Order[];
    allOrders: Order[];
    loading: boolean;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    expandedOrderId: string | null;
    toggleExpand: (orderId: string) => void;
    updatingOrderId: string | null;
    confirmModal: ConfirmModalState;
    statusLogs: Record<string, StatusChangeLog[]>;
    fetchOrders: () => Promise<void>;
    requestStatusChange: (orderId: string, newStatus: string) => void;
    handleStatusChange: (orderId: string, newStatus: string) => Promise<void>;
    closeConfirmModal: () => void;
    getFilterCount: (filterKey: string) => number;
    totalAmount: number;
    filterRef: React.RefObject<HTMLDivElement | null>;
}

export function useOrders(): UseOrdersReturn {
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [statusLogs, setStatusLogs] = useState<Record<string, StatusChangeLog[]>>({});
    const filterRef = useRef<HTMLDivElement | null>(null);

    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false, orderId: '', newStatus: '', title: '', message: '', confirmLabel: '', isDanger: false,
    });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const allResponse = await fetch('/api/orders');
            if (!allResponse.ok) throw new Error('주문 목록을 불러오는데 실패했습니다.');
            const allData = await allResponse.json();
            setAllOrders(allData || []);
            if (activeFilter === 'all') {
                setOrders(allData || []);
            } else {
                setOrders((allData || []).filter((o: Order) => o.status === activeFilter));
            }
        } catch (err: any) {
            console.error('Orders fetch error:', err);
            toast.error(err.message || '주문 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const requestStatusChange = (orderId: string, newStatus: string) => {
        const statusLabel = getStatusInfo(newStatus).label;
        const isDanger = newStatus === 'cancelled';
        setConfirmModal({
            isOpen: true, orderId, newStatus,
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
            if (!response.ok) throw new Error(data.error || '상태 변경 실패');

            setStatusLogs(prev => ({
                ...prev,
                [orderId]: [...(prev[orderId] || []), { from: oldStatus, to: newStatus, changedAt: new Date().toISOString(), changedBy: '관리자' }],
            }));
            toast.success(`주문 상태가 "${getStatusInfo(newStatus).label}"(으)로 변경되었습니다.`);
            fetchOrders();
        } catch (error: any) {
            toast.error(error.message || '상태 변경에 실패했습니다.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const toggleExpand = (orderId: string) => setExpandedOrderId(prev => prev === orderId ? null : orderId);
    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
    const getFilterCount = (filterKey: string) => filterKey === 'all' ? allOrders.length : allOrders.filter(o => o.status === filterKey).length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
        orders, allOrders, loading, activeFilter, setActiveFilter,
        expandedOrderId, toggleExpand, updatingOrderId,
        confirmModal, statusLogs, fetchOrders,
        requestStatusChange, handleStatusChange, closeConfirmModal,
        getFilterCount, totalAmount, filterRef,
    };
}
