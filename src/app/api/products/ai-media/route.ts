// 상품의 AI 미디어 (성별별) 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    try {
        const aiMedia = await productStore.getAiMedia(productId);
        return NextResponse.json({ aiMedia });
    } catch (error) {
        console.error('AI Media 조회 오류:', error);
        return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }
}
