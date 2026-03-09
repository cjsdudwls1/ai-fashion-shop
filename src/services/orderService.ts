import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateOrderCode } from '@/lib/orderUtils';
import { CreateOrderInput } from '@/types/order';
import { stockService } from '@/services/stockService';
import { notificationService } from '@/services/notificationService';

export const orderService = {
    /**
     * 주문을 생성하고 재고를 차감하며 알림을 발송합니다.
     */
    async createOrder(input: CreateOrderInput) {
        const { userId, items, shippingInfo, depositorName, totalAmount } = input;

        // 1. Validation
        if (!items || items.length === 0) {
            throw new Error('주문할 상품이 없습니다.');
        }
        if (!shippingInfo?.name || !shippingInfo?.phone || !shippingInfo?.roadAddress) {
            throw new Error('배송지 정보를 입력해주세요.');
        }
        if (!depositorName?.trim()) {
            throw new Error('입금자명을 입력해주세요.');
        }

        // 2. 주문번호 생성
        const orderCode = generateOrderCode();

        // 3. 배송 주소 조합
        const fullAddress = `[${shippingInfo.zonecode}] ${shippingInfo.roadAddress} ${shippingInfo.detailAddress || ''}`.trim();

        // 4. orders 테이블에 INSERT
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId || null,
                status: 'payment_confirming',
                total_amount: totalAmount,
                shipping_name: shippingInfo.name,
                shipping_phone: shippingInfo.phone,
                shipping_address: fullAddress,
                shipping_memo: shippingInfo.memo || null,
                depositor_name: depositorName.trim(),
                guest_order_code: orderCode,
            })
            .select('id')
            .single();

        if (orderError || !order) {
            console.error('Order insert error:', orderError);
            throw new Error('주문 생성에 실패했습니다.');
        }

        // 5. order_items 테이블에 INSERT
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_title: item.title,
            quantity: item.quantity,
            price_at_purchase: item.price,
            item_option: {
                color: item.selectedColor || null,
                size: item.selectedSize || null,
            },
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items insert error:', itemsError);
            // 롤백: 주문 삭제
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            throw new Error(`주문 상품 등록에 실패했습니다. 상세 내용: ${itemsError.message} / ${itemsError.details || ''}`);
        }

        // 6. 재고 차감
        const deductItems = items.map(item => ({
            product_id: item.id,
            color: item.selectedColor || undefined,
            size: item.selectedSize || undefined,
            quantity: item.quantity,
        }));
        
        const deductResult = await stockService.deductStock(deductItems);
        if (!deductResult.success) {
            console.error('재고 차감 실패:', deductResult.error);
            // 롤백: 주문 삭제
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            throw new Error(`재고 차감에 실패했습니다. 상세 내용: ${deductResult.error}`);
        }

        // 7. 텔레그램 알림 전송 (비동기로 실행되게)
        const itemNames = items.map(i => `${i.title} (${i.quantity}개)`).join(', ');
        notificationService.sendOrderNotification(orderCode, depositorName, totalAmount, itemNames);

        return {
            success: true,
            orderId: order.id,
            orderCode: orderCode,
            message: '주문이 완료되었습니다.',
        };
    }
};