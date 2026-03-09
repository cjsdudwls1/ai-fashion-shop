import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, handleAuthError } from '@/lib/authUtils';
import { orderService } from '@/services/orderService';
import { CreateOrderInput } from '@/types/order';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const input: CreateOrderInput = body;

        const result = await orderService.createOrder(input);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Order API Error:', error);
        const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        // 에러 메시지에 따라 상태 코드 분기 (예: Validation 오류는 400, 그 외 500)
        const status = errorMessage.includes('입력') || errorMessage.includes('없습니다') ? 400 : 500;
        return NextResponse.json({ error: errorMessage }, { status });
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
