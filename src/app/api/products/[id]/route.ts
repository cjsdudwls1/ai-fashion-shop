// 개별 상품 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';
import { requireAdmin, handleAuthError } from '@/lib/authUtils';

// GET: 개별 상품 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await productStore.getProduct(id);

        if (!product) {
            return NextResponse.json(
                { error: '상품을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error('상품 조회 오류:', error);
        return NextResponse.json(
            { error: '상품 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH: 개별 상품 업데이트
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // 관리자 권한 검증
    try {
        await requireAdmin();
    } catch (e) {
        return handleAuthError(e) ?? NextResponse.json({ error: '인증 오류' }, { status: 500 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        // 직접 supabaseAdmin을 사용하여 업데이트
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.colors !== undefined) updates.colors = body.colors;
        if (body.sizes !== undefined) updates.sizes = body.sizes;
        if (body.price !== undefined) updates.price = body.price;
        // 다른 필드 필요 시 추가 가능

        const { error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('상품 업데이트 에러:', error);
            return NextResponse.json({ error: '상품 업데이트 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '상품이 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('상품 업데이트 중 오류:', error);
        return NextResponse.json(
            { error: '상품 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
