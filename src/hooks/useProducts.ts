'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { CATEGORY_MAP } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';
import { useSyncPolling } from '@/hooks/useSyncPolling';

export interface UseProductsReturn {
    // 상태
    products: Product[];
    loading: boolean;
    filteredProducts: Product[];

    // 카테고리 필터
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    availableCategories: string[];
    getCategoryDisplayName: (cat: string) => string;

    // 보기 모드
    viewMode: 'gallery' | 'trash';
    setViewMode: (mode: 'gallery' | 'trash') => void;

    // 편집 모드 (관리자 전용)
    isEditMode: boolean;
    setIsEditMode: (mode: boolean) => void;
    selectedToDelete: string[];
    toggleSelectProduct: (productId: string) => void;
    setSelectedToDelete: (ids: string[]) => void;

    // 관리자 CRUD
    handleDeleteProducts: () => Promise<void>;
    handleRestoreProducts: () => Promise<void>;

    // 비디오
    selectedProduct: Product | null;
    handleVideoPlay: (product: Product) => void;
    setSelectedProduct: (product: Product | null) => void;

    // 관리자 여부
    isAdmin: boolean;

    // 폴링
    fetchProducts: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'gallery' | 'trash'>('gallery');
    const { isAdmin } = useAdmin();

    // 제품 목록 가져오기
    const fetchProducts = useCallback(async () => {
        try {
            const endpoint = `/api/products?t=${Date.now()}&status=${viewMode === 'trash' ? 'trash' : 'active'}`;
            const response = await fetch(endpoint, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) {
                console.error(`[fetchProducts] API 에러: HTTP ${response.status}`);
                toast.error('서버 연결에 실패했습니다. 잠시 후 다시 시도합니다.');
                return;
            }
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('제품 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    // 카테고리 필터링
    const filteredProducts = products.filter(product => {
        if (selectedCategory === 'all') return true;
        return product.category === selectedCategory;
    });

    // 존재하는 카테고리 목록
    const availableCategories = ['all', ...Array.from(new Set(products.map(p => p.category).filter((c): c is string => !!c)))];

    const getCategoryDisplayName = (cat: string) => CATEGORY_MAP[cat] || cat;

    // generating/pending 상태 확인
    const hasGeneratingProducts = products.some(
        p => p.videoStatus === 'generating' || p.videoStatus === 'pending'
    );

    // 초기 로드
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // sync 폴링
    useSyncPolling({
        enabled: hasGeneratingProducts,
        intervalMs: 15000,
        onTick: fetchProducts
    });

    // 비디오 재생
    const handleVideoPlay = (product: Product) => {
        if (isEditMode) return;
        if (product.videoStatus === 'completed' && product.videoUrl) {
            setSelectedProduct(product);
        }
    };

    // 삭제 선택 토글
    const toggleSelectProduct = (productId: string) => {
        setSelectedToDelete(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    // 제품 삭제 처리
    const handleDeleteProducts = async () => {
        if (selectedToDelete.length === 0) return;

        const isTrash = viewMode === 'trash';
        const message = isTrash
            ? '선택한 상품을 영구 삭제하시겠습니까? 복구할 수 없습니다.'
            : '선택한 상품을 휴지통으로 이동하시겠습니까?';

        if (!confirm(message)) return;

        setLoading(true);
        try {
            const url = isTrash ? '/api/products?action=permanent' : '/api/products';
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedToDelete })
            });

            if (response.ok) {
                alert(isTrash ? '영구 삭제되었습니다.' : '휴지통으로 이동되었습니다.');
                setSelectedToDelete([]);
                setIsEditMode(false);
                fetchProducts();
            } else {
                alert('작업 실패');
                setLoading(false);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('오류가 발생했습니다.');
            setLoading(false);
        }
    };

    // 제품 복구 처리
    const handleRestoreProducts = async () => {
        if (selectedToDelete.length === 0) return;
        if (!confirm('선택한 상품을 복구하시겠습니까?')) return;

        setLoading(true);
        try {
            const response = await fetch('/api/products?action=restore', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedToDelete })
            });

            if (response.ok) {
                alert('복구되었습니다.');
                setSelectedToDelete([]);
                fetchProducts();
            } else {
                alert('복구 실패');
                setLoading(false);
            }
        } catch (error) {
            console.error('복구 오류:', error);
            alert('오류가 발생했습니다.');
            setLoading(false);
        }
    };

    return {
        products,
        loading,
        filteredProducts,
        selectedCategory,
        setSelectedCategory,
        availableCategories,
        getCategoryDisplayName,
        viewMode,
        setViewMode,
        isEditMode,
        setIsEditMode,
        selectedToDelete,
        toggleSelectProduct,
        setSelectedToDelete,
        handleDeleteProducts,
        handleRestoreProducts,
        selectedProduct,
        handleVideoPlay,
        setSelectedProduct,
        isAdmin,
        fetchProducts,
    };
}
