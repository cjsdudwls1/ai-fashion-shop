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

        // productStore.updateProduct를 사용하여 부분 업데이트 (DB 접근 추상화 계층 활용)
        const success = await productStore.updateProduct(id, body);

        if (!success) {
            return NextResponse.json({ error: '상품 업데이트 실패 (또는 대상 없음)' }, { status: 500 });
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
