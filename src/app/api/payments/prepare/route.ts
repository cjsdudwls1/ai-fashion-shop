import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/services/orderService';
import { CreateOrderInput } from '@/types/order';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const input: CreateOrderInput = body;

        // 결제 사전 등록: 주문을 'pending_payment' 상태로 생성
        const paymentId = crypto.randomUUID();
        input.paymentMethod = 'card';
        input.paymentId = paymentId;

        const result = await orderService.createOrder(input);

        return NextResponse.json({
            ...result,
            paymentId
        });
    } catch (error: any) {
        console.error('Payment Prepare API Error:', error);
        const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        const status = errorMessage.includes('입력') || errorMessage.includes('없습니다') ? 400 : 500;
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
