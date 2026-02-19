// 상품 API 라우트
// POST: 새 상품 등록 (자동 영상 생성 트리거)
// GET: 전체 상품 조회

import { NextRequest, NextResponse } from 'next/server';
import { productStore, parseColorStock, parseSizeStock } from '@/lib/productStore';
import { generateProductVideo } from '@/lib/aiVideoService';
import { Product, ProductInput } from '@/lib/types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { productSchema } from '@/lib/validations';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// 고유 ID 생성
function generateId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Admin 권한 확인 유틸리티
async function checkAdminAuth() {
    return true; // [개발용] 모든 요청 허용 (관리자 권한 체크 우회)
    // TODO: 운영 배포 시 반드시 원래 로직으로 복구해야 함

    /*
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const isAdmin =
        user.email === 'admin@fashion.local' ||
        user.user_metadata?.is_admin === true ||
        user.user_metadata?.role === 'admin' ||
        user.app_metadata?.role === 'admin';

    return isAdmin;
    */
}

// GET: 전체 상품 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let products;
        if (status === 'trash') {
            products = await productStore.getTrashProducts();
        } else {
            products = await productStore.getAllProducts();
        }

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
    // Admin 권한 체크
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await request.json();

        // Zod Validation
        const validationResult = productSchema.safeParse(json);

        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues.map((e: any) => e.message).join(', ');
            return NextResponse.json(
                { error: `Validation Error: ${errorMessage}` },
                { status: 400 }
            );
        }

        const body = validationResult.data;

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
            imageUrl: body.imageBase64, // Base64 이미지 직접 저장 (Primary)
            galleryImages: body.galleryImages?.map(img => ({
                url: img.base64,
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
            videoStatus: 'pending',
            price: body.price, // Add price
            createdAt: new Date(),
        };

        // 저장소에 추가
        await productStore.addProduct(newProduct, supabaseAdmin);
        console.log(`[Product] 새 상품 등록: ${productId} - ${body.name} (${gender === 'female' ? '여성복' : '남성복'})`);

        // AI 영상 생성 자동 트리거 (비동기 - 응답 대기 안 함)
        console.log(`[Product] AI 영상 생성 트리거 시작...`);

        // setTimeout을 사용하여 응답 후에도 실행되도록 보장
        setTimeout(() => {
            console.log(`[Product] setTimeout 내부 - generateProductVideo 호출`);
            generateProductVideo(productId, body.imageBase64, {
                name: body.name,
                fabric: body.fabric,
                gender: body.gender as 'female' | 'male' | 'unisex',
                category: body.category, // Pass category for prompt generation
                narrationText: body.narrationText, // Pass custom narration
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
    // Admin 권한 체크
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
