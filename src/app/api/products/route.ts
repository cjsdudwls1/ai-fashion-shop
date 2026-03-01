// 상품 API 라우트
// POST: 새 상품 등록 (자동 영상 생성 트리거)
// GET: 전체 상품 조회

import { NextRequest, NextResponse } from 'next/server';
import { productStore, parseColorStock, parseSizeStock } from '@/lib/productStore';
import { Product } from '@/lib/types';
import { productSchema } from '@/lib/validations';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, handleAuthError } from '@/lib/authUtils';
import type { ZodIssue } from 'zod';

// 고유 ID 생성
function generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 전체 상품 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // 삭제된 상품(trash) 조회는 관리자만 허용
        if (status === 'trash') {
            try {
                await requireAdmin();
            } catch (e) {
                return handleAuthError(e) ?? NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
            }
            const products = await productStore.getTrashProducts();
            return NextResponse.json({ products });
        }

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
    // 관리자 권한 검증
    try {
        await requireAdmin();
    } catch (e) {
        return handleAuthError(e) ?? NextResponse.json({ error: '인증 오류' }, { status: 500 });
    }

    try {
        const json = await request.json();

        // Zod Validation
        const validationResult = productSchema.safeParse(json);

        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues.map((e: ZodIssue) => e.message).join(', ');
            return NextResponse.json(
                { error: `Validation Error: ${errorMessage}` },
                { status: 400 }
            );
        }

        const body = validationResult.data;

        // 미디어 생성 타입 (기본값: video)
        const mediaGenerationType = body.mediaGenerationType || 'video';

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
            imageUrl: body.imageUrl || body.imageBase64 || '', // Base64 대신 URL 사용
            galleryImages: body.galleryImages?.map((img: any) => ({
                url: img.url || img.base64 || '',
                color: img.color,
                isPrimary: img.isPrimary
            })) || [], // 갤러리 이미지 저장
            fabric: body.fabric,
            gender,
            category: body.category, // New field
            colors,
            sizes,
            videoUrl: null,
            audioUrl: null,
            videoStatus: mediaGenerationType === 'none' ? 'completed' : 'pending',
            mediaGenerationType,
            narrationText: body.narrationText || null,
            videoModel: body.videoModel || null,
            price: body.price, // Add price
            createdAt: new Date(),
        };

        // 저장소에 추가
        await productStore.addProduct(newProduct, supabaseAdmin);
        console.log(`[Product] 새 상품 등록: ${productId} - ${body.name} (${gender === 'female' ? '여성복' : '남성복'}) [미디어: ${mediaGenerationType}]`);

        // AI 미디어 생성 자동 트리거 (video 또는 image 선택 시)
        if (mediaGenerationType === 'video' || mediaGenerationType === 'image') {
            console.log(`[Product] AI 미디어 생성 트리거 시작... (Sync Worker 킥오프) [모드: ${mediaGenerationType}]`);

            // Vercel, Netlify 타임아웃 방지: 비동기 워커로 실제 처리를 이관함
            const host = request.headers.get('host');
            const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
            fetch(`${protocol}://${host}/api/admin/videos/sync`, { method: 'GET' }).catch(() => { });
        } else {
            console.log(`[Product] 미디어 생성 건너뜀 (선택: ${mediaGenerationType})`);
        }

        return NextResponse.json({
            success: true,
            product: newProduct,
            message: mediaGenerationType === 'video'
                ? '상품이 등록되었습니다. AI 영상이 백그라운드에서 안전하게 생성됩니다.'
                : mediaGenerationType === 'image'
                    ? '상품이 등록되었습니다. AI 이미지가 백그라운드에서 생성됩니다.'
                    : '상품이 등록되었습니다.',
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
    // 관리자 권한 검증
    try {
        await requireAdmin();
    } catch (e) {
        return handleAuthError(e) ?? NextResponse.json({ error: '인증 오류' }, { status: 500 });
    }

    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: '삭제할 상품 ID 목록이 필요합니다.' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action'); // 'restore' | 'permanent' | undefined

        const results = await Promise.all(
            ids.map(id => {
                if (action === 'restore') {
                    return productStore.restoreProduct(id, supabaseAdmin);
                } else if (action === 'permanent') {
                    return productStore.permanentDeleteProduct(id, supabaseAdmin);
                } else {
                    return productStore.deleteProduct(id, supabaseAdmin);
                }
            })
        );

        const successCount = results.filter(Boolean).length;
        const actionName = action === 'restore' ? '복구' : (action === 'permanent' ? '영구 삭제' : '삭제');

        if (successCount === 0) {
            return NextResponse.json(
                { error: `상품 ${actionName}에 실패했습니다.` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${successCount}개의 상품이 ${actionName}되었습니다.`,
            count: successCount
        });

    } catch (error) {
        console.error('상품 삭제 오류:', error);
        return NextResponse.json(
            { error: '상품 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
