import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateOrderCode } from '@/lib/orderUtils';
import { requireAdmin, handleAuthError } from '@/lib/authUtils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId,
            items,         // CartItem[]
            shippingInfo,  // { name, phone, zonecode, roadAddress, detailAddress, memo }
            depositorName, // 입금자명
            totalAmount,   // 총 결제금액
        } = body;

        // 1. Validation
        if (!items || items.length === 0) {
            return NextResponse.json({ error: '주문할 상품이 없습니다.' }, { status: 400 });
        }
        if (!shippingInfo?.name || !shippingInfo?.phone || !shippingInfo?.roadAddress) {
            return NextResponse.json({ error: '배송지 정보를 입력해주세요.' }, { status: 400 });
        }
        if (!depositorName?.trim()) {
            return NextResponse.json({ error: '입금자명을 입력해주세요.' }, { status: 400 });
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
            return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 });
        }

        // 5. order_items 테이블에 INSERT
        const orderItems = items.map((item: any) => ({
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
            return NextResponse.json({ error: `주문 상품 등록에 실패했습니다. 상세 내용: ${itemsError.message} / ${itemsError.details || ''}` }, { status: 500 });
        }

        // 6. 재고 차감
        for (const item of items) {
            const { data: product, error: fetchError } = await supabaseAdmin
                .from('products')
                .select('colors, sizes')
                .eq('id', item.id)
                .single();

            if (fetchError || !product) {
                console.error(`Product ${item.id} fetch error:`, fetchError);
                continue; // 재고 차감 실패해도 주문은 유지
            }

            const colors = product.colors || [];
            const sizes = product.sizes || [];

            const colorIdx = colors.findIndex((c: any) => c.color === item.selectedColor);
            const sizeIdx = sizes.findIndex((s: any) => s.size === item.selectedSize);

            if (colorIdx >= 0) {
                colors[colorIdx].quantity = Math.max(0, colors[colorIdx].quantity - item.quantity);
            }
            if (sizeIdx >= 0) {
                sizes[sizeIdx].quantity = Math.max(0, sizes[sizeIdx].quantity - item.quantity);
            }

            await supabaseAdmin
                .from('products')
                .update({ colors, sizes })
                .eq('id', item.id);
        }

        // 7. 텔레그램 알림 전송 (비동기로 실행되게)
        import('@/lib/telegramUtils').then(({ sendTelegramNotification }) => {
            const itemNames = items.map((i: any) => `${i.title} (${i.quantity}개)`).join(', ');
            const message = `
🔔 <b>신규 주문 알림</b>
- 주문번호: ${orderCode}
- 주문자: ${depositorName}
- 결제금액: ${totalAmount.toLocaleString()}원
- 상품: ${itemNames}
            `.trim();

            sendTelegramNotification(message).catch(err => console.error('Telegram Notify Error:', err));
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderCode: orderCode,
            message: '주문이 완료되었습니다.',
        });

    } catch (error) {
        console.error('Order API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // 관리자 권한 검증: 전체 주문 목록은 관리자만 조회 가능
    try {
        await requireAdmin();
    } catch (e) {
        return handleAuthError(e) ?? NextResponse.json({ error: '인증 오류' }, { status: 500 });
    }

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');

        let query = supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    id, product_id, product_title, quantity, price_at_purchase, item_option
                )
            `)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('All Orders fetch error:', error);
            return NextResponse.json({ error: '주문 목록을 가져오는데 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Order GET API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
