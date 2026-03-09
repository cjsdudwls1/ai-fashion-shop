import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { productStore } from '@/lib/productStore';
import { ProductDetailView } from '@/components/ProductDetailView';

export const dynamic = 'force-dynamic';

/**
 * React cache()로 동일 요청 내 중복 DB 조회 방지.
 * generateMetadata()와 Page 컴포넌트가 동일 id로 호출될 때 1회만 실행.
 * 참고: https://react.dev/reference/react/cache
 */
const getProduct = cache(async (id: string) => {
    return productStore.getProduct(id);
});

// Next.js 15+ requires params to be a Promise
type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return {
            title: '상품을 찾을 수 없습니다 | AI Fashion Shop',
        };
    }

    return {
        title: `${product.name} | AI Fashion Shop`,
        description: product.fabric || `AI Fashion Shop에서 ${product.name}을(를) 만나보세요.`,
        openGraph: {
            title: product.name,
            description: product.fabric || `AI Fashion Shop에서 ${product.name}을(를) 만나보세요.`,
            images: [product.displayImageUrl || product.imageUrl].filter(Boolean) as string[],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    return <ProductDetailView product={product} />;
}
