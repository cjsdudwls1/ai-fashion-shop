import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productStore } from '@/lib/productStore';
import { ProductDetailView } from '@/components/ProductDetailView';
import https from 'https';

export const dynamic = 'force-dynamic';

function getProductData(id: string): Promise<any> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !key) return Promise.resolve(undefined);

    const url = new URL(`${supabaseUrl}/rest/v1/products?id=eq.${id}&select=id,name,image_url,gallery_images,fabric,gender,category,colors,sizes,video_url,audio_url,video_status,video_error_reason,price,created_at,deleted_at,kling_task_id,tryon_image_url,media_generation_type`);

    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json || json.length === 0) return resolve(undefined);

                    const row = json[0];
                    resolve({
                        id: row.id,
                        name: row.name,
                        imageUrl: row.image_url,
                        galleryImages: row.gallery_images || [],
                        fabric: row.fabric,
                        gender: row.gender,
                        category: row.category || 'short-sleeve',
                        colors: row.colors || [],
                        sizes: row.sizes || [],
                        videoUrl: row.video_url,
                        audioUrl: row.audio_url,
                        videoStatus: row.video_status,
                        videoErrorReason: row.video_error_reason,
                        tryOnImageUrl: row.tryon_image_url || null,
                        mediaGenerationType: row.media_generation_type || 'video',
                        price: row.price,
                        createdAt: new Date(row.created_at),
                        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null
                    });
                } catch (e) {
                    console.error('Product parse error:', e);
                    resolve(undefined);
                }
            });
        }).on('error', (e) => {
            console.error('HTTPS get error for product:', id, e);
            resolve(undefined);
        });
    });
}

// Request Memoization Cache to combine identical requests from Metadata and Page
const requestCache = new Map<string, Promise<any>>();

function getProduct(id: string) {
    if (!requestCache.has(id)) {
        requestCache.set(id, getProductData(id));
        // Auto-evict from cache after 5 seconds to keep it fresh for next requests
        setTimeout(() => requestCache.delete(id), 5000);
    }
    return requestCache.get(id);
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
