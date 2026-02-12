// 메모리 기반 상품 저장소
// 나중에 실제 데이터베이스로 교체 가능하도록 인터페이스 설계

import { Product, ColorStock, SizeStock } from './types';

class ProductStore {
    private products: Map<string, Product> = new Map();

    // 상품 추가
    addProduct(product: Product): void {
        this.products.set(product.id, product);
    }

    // 상품 조회
    getProduct(id: string): Product | undefined {
        return this.products.get(id);
    }

    // 전체 상품 조회 (최신순)
    getAllProducts(): Product[] {
        return Array.from(this.products.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    // 상품 업데이트
    updateProduct(id: string, updates: Partial<Product>): boolean {
        const product = this.products.get(id);
        if (!product) return false;

        this.products.set(id, { ...product, ...updates });
        return true;
    }

    // 상품 삭제
    deleteProduct(id: string): boolean {
        return this.products.delete(id);
    }

    // 영상 상태 업데이트
    updateVideoStatus(id: string, status: Product['videoStatus'], videoUrl?: string): boolean {
        const product = this.products.get(id);
        if (!product) return false;

        product.videoStatus = status;
        if (videoUrl) {
            product.videoUrl = videoUrl;
        }

        return true;
    }
}

// 싱글톤 인스턴스 (서버 재시작 시 초기화됨)
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
