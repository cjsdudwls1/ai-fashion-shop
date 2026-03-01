// 주문 상태 관련 유틸리티
// DB에는 영어 키를 저장하고, UI에서는 한글 라벨로 매핑한다.

export type OrderStatus =
    | 'pending_payment'
    | 'payment_confirming'
    | 'paid'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export interface StatusInfo {
    label: string;
    color: string;
    description: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, StatusInfo> = {
    pending_payment: {
        label: '입금 대기',
        color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        description: '주문 제출 직후, 입금 전 상태',
    },
    payment_confirming: {
        label: '주문확인중',
        color: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
        description: '고객이 입금 완료 후 주문 완료 버튼을 눌렀을 때',
    },
    paid: {
        label: '결제 완료',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        description: '관리자가 입금을 확인한 후',
    },
    shipped: {
        label: '배송 중',
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        description: '상품 발송 후',
    },
    delivered: {
        label: '배송 완료',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        description: '배송 완료 후',
    },
    cancelled: {
        label: '주문 취소',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        description: '주문 취소 시',
    },
};

export function getStatusInfo(status: string): StatusInfo {
    return (
        ORDER_STATUS_MAP[status as OrderStatus] || {
            label: status,
            color: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
            description: '',
        }
    );
}

// 관리자 계좌 정보 (환경변수 또는 하드코딩)
export const ADMIN_BANK_INFO = {
    bankName: '국민은행',
    accountNumber: '218301-04-318699',
    accountHolder: '천영진',
};

// 주문번호 생성 (8자리 영숫자)
export function generateOrderCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
