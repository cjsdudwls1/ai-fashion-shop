'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FeaturedProduct {
    id: string;
    name: string;
    price: number;
    image_url: string;
    display_image_url: string | null;
    tryon_image_url: string | null;
    category: string | null;
    fabric: string | null;
}

export function FeaturedProducts() {
    const [products, setProducts] = useState<FeaturedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, price, image_url, display_image_url, tryon_image_url, category, fabric')
                    .is('deleted_at', null)
                    .gt('price', 0)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!error && data) {
                    setProducts(data);
                }
            } catch (err) {
                console.error('Failed to fetch featured products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <section className="py-24 bg-[var(--bg-dark)]">
                <div className="container-main px-4 md:px-8 text-center">
                    <h2 className="font-serif text-3xl md:text-4xl mb-12">Curated for You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={`aspect-[3/4] relative bg-[var(--bg-elevated)] overflow-hidden border border-[var(--border-color)] ${i === 1 ? 'hidden md:block mt-12' : ''}`}>
                                <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="h-4 w-24 bg-[var(--bg-card)] mb-2 animate-pulse"></div>
                                    <div className="h-3 w-16 bg-[var(--bg-card)] animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-24 bg-[var(--bg-dark)]">
            <div className="container-main px-4 md:px-8 text-center">
                <h2 className="font-serif text-3xl md:text-4xl mb-4">Curated for You</h2>
                <p className="text-sm text-[var(--text-muted)] tracking-wider uppercase mb-12">AI 피팅으로 엄선된 추천 상품</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
                    {products.map((product, idx) => {
                        const imgSrc = product.image_url || product.display_image_url || product.tryon_image_url || '/placeholder.png';
                        return (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className={`group aspect-[3/4] relative bg-[var(--bg-elevated)] overflow-hidden border border-[var(--border-color)] cursor-pointer ${idx === 1 ? 'hidden md:block md:mt-12' : ''}`}
                            >
                                <Image
                                    src={imgSrc}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 text-left">
                                    <h3 className="text-white font-serif text-lg font-semibold mb-1 drop-shadow-lg">
                                        {product.name}
                                    </h3>
                                    <p className="text-white/70 text-xs tracking-wider mb-2">
                                        {product.category || 'Collection'}
                                        {product.fabric && ` · ${product.fabric}`}
                                    </p>
                                    <span className="text-white font-medium text-sm drop-shadow-lg">
                                        ₩{product.price.toLocaleString()}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
