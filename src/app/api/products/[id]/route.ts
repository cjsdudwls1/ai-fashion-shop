// 개별 상품 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';

// GET: 개별 상품 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = productStore.getProduct(id);

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
