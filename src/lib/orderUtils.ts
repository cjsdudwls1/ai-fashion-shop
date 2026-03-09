// 주문 상태 관련 유틸리티
// DB에는 영어 키를 저장하고, UI에서는 한글 라벨로 매핑한다.

export type OrderStatus =
    | 'pending_payment'
    | 'payment_confirming'
    | 'paid'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

// [2026-03-06] 그룹 F: 주문 상태 값 상수 배열
// 사유: orders/[id]/route.ts 등에서 하드코딩된 validStatuses 배열 제거
// 근거: .docs/refactoring-group-f-shared-utils.md L-7
export const ORDER_STATUSES: OrderStatus[] = [
    'pending_payment', 'payment_confirming', 'paid', 'shipped', 'delivered', 'cancelled'
] as const as unknown as OrderStatus[];

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

// [2026-03-06] 그룹 G: 계좌 정보 환경변수 전환
// 사유: 민감 정보를 소스코드에서 분리하여 Git 이력에서 노출 방지
// 근거: .docs/refactoring-group-g-security.md L-11
export const ADMIN_BANK_INFO = {
    bankName: process.env.ADMIN_BANK_NAME || '농협',
    accountNumber: process.env.ADMIN_BANK_ACCOUNT || '',
    accountHolder: process.env.ADMIN_BANK_HOLDER || '',
};

// 배송비 정책
export const SHIPPING_FEE = 3000; // 기본 배송비
export const FREE_SHIPPING_THRESHOLD = 30000; // 무료 배송 기준 금액

export function getShippingFee(totalProductPrice: number): number {
    return totalProductPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

// 주문번호 생성 (8자리 영숫자) - 암호학적으로 안전한 Web Crypto API 사용
export function generateOrderCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars[array[i] % chars.length];
    }
    return result;
}
