// [2026-03-06] 그룹 H: CartItem 공유 타입 정의
// 사유: cartStore.ts에서 로컬 정의된 CartItem을 공유 타입 파일로 이동하여
// orders/route.ts 등 다른 모듈에서도 any 대신 구체적 타입으로 참조 가능
// 근거: .docs/refactoring-group-h-type-safety.md L-13

export interface CartItem {
    id: string; // product id
    title: string;
    price: number;
    image_url?: string;
    quantity: number;
    category?: string;
    selectedColor?: string;
    selectedSize?: string;
}
