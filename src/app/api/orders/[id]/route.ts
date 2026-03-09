import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ORDER_STATUSES } from '@/lib/orderUtils';

// PATCH: 주문 상태 변경 (관리자 전용)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!id) {
            return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });
        }

        // [2026-03-06] 그룹 F: validStatuses 하드코딩 → ORDER_STATUSES 상수 import
        if (!ORDER_STATUSES.includes(status)) {
            return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Order update error:', error);
            return NextResponse.json({ error: '주문 상태 변경에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            order: data,
            message: `주문 상태가 변경되었습니다.`,
        });

    } catch (error) {
        console.error('Order PATCH API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET: 단일 주문 상세 조회
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    id, product_id, product_title, quantity, price_at_purchase, item_option
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Order GET API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
