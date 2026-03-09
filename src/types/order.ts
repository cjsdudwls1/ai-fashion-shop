/**
 * 주문 관련 공유 타입 정의
 * orders/page.tsx, profile/page.tsx 등에서 중복 정의되던 인터페이스를 통합한다.
 */

/** 주문 상품 항목 */
export interface OrderItem {
    id: string;
    product_id: string;
    product_title: string;
    quantity: number;
    price_at_purchase: number;
    item_option: { color?: string; size?: string };
    product_image?: string;
}

/** 주문 */
export interface Order {
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

/** 상태 변경 로그 (프론트엔드 세션 내 사용) */
export interface StatusChangeLog {
    from: string;
    to: string;
    changedAt: string;
    changedBy: string;
}

/** order-lookup 등에서 필요한 축소된 타입 지원 */
export type RecoveredOrder = Pick<Order, 'guest_order_code' | 'created_at' | 'total_amount' | 'status' | 'order_items'>;

/** 배송지 정보 */
export interface ShippingInfo {
    name: string;
    phone: string;
    zonecode: string;
    roadAddress: string;
    detailAddress: string;
    memo: string;
}

/** 주문 생성 시 입력받는 개별 상품 데이터 */
export interface OrderItemInput {
    id: string;
    title: string;
    price: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
}

/** 주문 생성 요청 Payload */
export interface CreateOrderInput {
    userId?: string;
    items: OrderItemInput[];
    shippingInfo: ShippingInfo;
    depositorName: string;
    totalAmount: number;
}
