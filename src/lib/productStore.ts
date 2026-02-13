import { createClient } from '@supabase/supabase-js';
import { Product, ColorStock, SizeStock } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

class ProductStore {
    // 상품 추가
    async addProduct(product: Product): Promise<void> {
        const { error } = await supabase
            .from('products')
            .insert({
                id: product.id,
                name: product.name,
                image_url: product.imageUrl,
                fabric: product.fabric,
                gender: product.gender,
                category: product.category, // New field for Supabase
                colors: product.colors,
                sizes: product.sizes,
                video_url: product.videoUrl,
                audio_url: product.audioUrl,
                video_status: product.videoStatus,
                created_at: product.createdAt
            });

        if (error) {
            console.error('Supabase addProduct error:', error);
            throw error;
        }
    }

    // 상품 조회
    async getProduct(id: string): Promise<Product | undefined> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;
        return this.mapToProduct(data);
    }

    // 전체 상품 조회 (최신순)
    async getAllProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase getAllProducts error:', error);
            return [];
        }
        return (data || []).map(this.mapToProduct);
    }

    // 상품 업데이트
    async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
        if (updates.fabric) dbUpdates.fabric = updates.fabric;
        // Add other fields as needed... mostly used for video status

        const { error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id);

        return !error;
    }

    // 상품 삭제
    async deleteProduct(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        return !error;
    }

    // 영상 상태 업데이트
    async updateVideoStatus(id: string, status: Product['videoStatus'], videoUrl?: string, audioUrl?: string): Promise<boolean> {
        const updates: any = { video_status: status };
        if (videoUrl) updates.video_url = videoUrl;
        if (audioUrl) updates.audio_url = audioUrl;

        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) console.error('Supabase updateVideoStatus error:', error);
        return !error;
    }

    private mapToProduct(data: any): Product {
        return {
            id: data.id,
            name: data.name,
            imageUrl: data.image_url,
            fabric: data.fabric,
            gender: data.gender,
            category: data.category || 'short-sleeve', // Map from Supabase (nullable)
            colors: data.colors as ColorStock[],
            sizes: data.sizes as SizeStock[],
            videoUrl: data.video_url,
            audioUrl: data.audio_url,
            videoStatus: data.video_status,
            createdAt: new Date(data.created_at)
        };
    }
}

// 싱글톤 인스턴스
export const productStore = new ProductStore();

// 텍스트 파싱 유틸리티
export function parseColorStock(text: string): ColorStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [color, quantity] = line.split(':').map(s => s.trim());
        return {
            color: color || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.color);
}

export function parseSizeStock(text: string): SizeStock[] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [size, quantity] = line.split(':').map(s => s.trim());
        return {
            size: size || '',
            quantity: parseInt(quantity) || 0
        };
    }).filter(item => item.size);
}
