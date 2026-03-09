// 상품 API 라우트
// POST: 새 상품 등록 (자동 영상 생성 트리거)
// GET: 전체 상품 조회

import { NextRequest, NextResponse } from 'next/server';
import { productStore } from '@/lib/productStore';
import { productSchema } from '@/lib/validations';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, handleAuthError } from '@/lib/authUtils';
import { createProduct } from '@/services/product';
import type { ZodIssue } from 'zod';

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

        // 서비스 레이어에 위임
        const host = request.headers.get('host');
        const isDev = process.env.NODE_ENV === 'development';
        const result = await createProduct(validationResult.data, host, isDev);

        return NextResponse.json({
            success: true,
            product: result.product,
            message: result.message,
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
