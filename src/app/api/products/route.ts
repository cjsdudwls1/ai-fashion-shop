// 상품 API 라우트
// POST: 새 상품 등록 (자동 영상 생성 트리거)
// GET: 전체 상품 조회

import { NextRequest, NextResponse } from 'next/server';
import { productStore, parseColorStock, parseSizeStock } from '@/lib/productStore';
import { generateProductVideo } from '@/lib/aiVideoService';
import { Product, ProductInput } from '@/lib/types';

// 고유 ID 생성
function generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 전체 상품 조회
export async function GET() {
    try {
        const products = await productStore.getAllProducts();
        return NextResponse.json({ products });
    } catch (error) {
        console.error('상품 조회 오류:', error);
        return NextResponse.json(
            { error: '상품 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST: 새 상품 등록
export async function POST(request: NextRequest) {
    try {
        const body: ProductInput = await request.json();

        // 유효성 검사
        if (!body.name || !body.imageBase64 || !body.fabric) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다 (상품명, 이미지, 질감)' },
                { status: 400 }
            );
        }

        // 상품 ID 생성
        const productId = generateId();

        // 색상/사이즈 파싱
        const colors = parseColorStock(body.colorsText || '');
        const sizes = parseSizeStock(body.sizesText || '');

        // 성별 기본값 처리
        const gender = body.gender || 'female';

        // 새 상품 생성
        const newProduct: Product = {
            id: productId,
            name: body.name,
            imageUrl: body.imageBase64, // Base64 이미지 직접 저장
            fabric: body.fabric,
            gender,
            category: body.category, // New field
            colors,
            sizes,
            videoUrl: null,
            audioUrl: null,
            videoStatus: 'pending',
            createdAt: new Date(),
        };

        // 저장소에 추가
        await productStore.addProduct(newProduct);
        console.log(`[Product] 새 상품 등록: ${productId} - ${body.name} (${gender === 'female' ? '여성복' : '남성복'})`);

        // AI 영상 생성 자동 트리거 (비동기 - 응답 대기 안 함)
        console.log(`[Product] AI 영상 생성 트리거 시작...`);

        // setTimeout을 사용하여 응답 후에도 실행되도록 보장
        setTimeout(() => {
            console.log(`[Product] setTimeout 내부 - generateProductVideo 호출`);
            generateProductVideo(productId, body.imageBase64, {
                name: body.name,
                fabric: body.fabric,
                gender,
                category: body.category, // Pass category for prompt generation
            }).then(() => {
                console.log(`[Product] AI 영상+음성 생성 완료`);
            }).catch(err => {
                console.error(`[Product] 영상 생성 실패:`, err.message || err);
            });
        }, 100);

        return NextResponse.json({
            success: true,
            product: newProduct,
            message: '상품이 등록되었습니다. AI 영상이 자동으로 생성됩니다.',
        });

    } catch (error) {
        console.error('상품 등록 오류:', error);
        return NextResponse.json(
            { error: '상품 등록 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
// DELETE: 상품 삭제 (단일 또는 다중)
export async function DELETE(request: NextRequest) {
    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: '삭제할 상품 ID 목록이 필요합니다.' },
                { status: 400 }
            );
        }

        const results = await Promise.all(
            ids.map(id => productStore.deleteProduct(id))
        );

        const successCount = results.filter(Boolean).length;

        if (successCount === 0) {
            return NextResponse.json(
                { error: '상품 삭제에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${successCount}개의 상품이 삭제되었습니다.`,
            deletedCount: successCount
        });

    } catch (error) {
        console.error('상품 삭제 오류:', error);
        return NextResponse.json(
            { error: '상품 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
