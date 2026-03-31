import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notificationService } from '@/services/notificationService';

export async function POST(req: NextRequest) {
    try {
        const { paymentId, orderId } = await req.json();

        // 1. 포트원 결제내역 단건조회 (V2)
        const paymentResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
            headers: { 'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}` }
        });
        
        if (!paymentResponse.ok) {
            throw new Error(`포트원 API 에러: ${paymentResponse.statusText}`);
        }
        
        const payment = await paymentResponse.json();
        
        // 2. DB에서 주문 정보 조회
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
            
        if (orderError || !order) {
            throw new Error('주문 정보를 찾을 수 없습니다.');
        }

        // 3. 결제 금액 검증
        if (payment.amount.total !== order.total_amount) {
            throw new Error('결제 금액이 일치하지 않습니다.');
        }

        // 4. 결제 상태 검증
        if (payment.status !== 'PAID') {
            throw new Error('결제가 완료되지 않았습니다.');
        }

        // 5. DB 상태 업데이트
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ 
                status: 'paid', 
                pg_provider: payment.channel?.pgProvider || 'portone',
                pg_transaction_id: payment.transactionId || null,
                paid_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            throw new Error('주문 상태 업데이트 실패');
        }

        // 6. 알림 전송 (주문명 조립 위해 order_items 필요)
        const { data: items } = await supabaseAdmin
            .from('order_items')
            .select('product_title, quantity')
            .eq('order_id', orderId);

        const itemNames = items ? items.map(i => `${i.product_title} (${i.quantity}개)`).join(', ') : '상품 정보 없음';
        notificationService.sendOrderNotification(order.guest_order_code, '카드결제', order.total_amount, itemNames);

        return NextResponse.json({ success: true, orderCode: order.guest_order_code });

    } catch (error: any) {
        console.error('Payment Verify Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
