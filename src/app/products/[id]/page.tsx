import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productStore } from '@/lib/productStore';
import { ProductDetailView } from '@/components/ProductDetailView';

// Helper to get product
async function getProduct(id: string) {
    return await productStore.getProduct(id);
}

// Next.js 15+ requires params to be a Promise
// However, to stay compatible if exact version behavior varies or if types are strict:
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
            images: product.imageUrl ? [product.imageUrl] : [],
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
