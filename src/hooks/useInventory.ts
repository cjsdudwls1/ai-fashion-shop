'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const supabase = createBrowserClient();

// ─── 타입 정의 ───
interface ColorStock { color: string; quantity: number; }
interface SizeStock { size: string; quantity: number; }

export interface InventoryProduct {
    id: string;
    name: string;
    image_url: string;
    colors: ColorStock[];
    sizes: SizeStock[];
    price: number;
    created_at: string;
}

export interface SkuItem {
    name: string;
    quantity: number;
}

// ─── 상수 ───
export const COLOR_OPTIONS = [
    '선택', 'Free', '블랙', '화이트', '그레이', '네이비',
    '베이지', '브라운', '레드', '블루', '그린', '옐로우', '핑크', '직접 입력',
];
export const SIZE_OPTIONS = ['선택', 'Free', '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '직접 입력'];

// ─── 헬퍼 함수 ───
export function buildSkuList(product: InventoryProduct): SkuItem[] {
    const skus: SkuItem[] = [];
    const { colors, sizes } = product;

    if (colors?.length > 0 && sizes?.length > 0) {
        colors.forEach(c => {
            sizes.forEach(s => {
                skus.push({ name: `${c.color} / ${s.size}`, quantity: Math.min(c.quantity, s.quantity) });
            });
        });
    } else if (colors?.length > 0) {
        colors.forEach(c => skus.push({ name: c.color, quantity: c.quantity }));
    } else if (sizes?.length > 0) {
        sizes.forEach(s => skus.push({ name: s.size, quantity: s.quantity }));
    }

    return skus;
}

export function calcTotalStock(skus: SkuItem[]): number {
    return skus.reduce((sum, s) => sum + s.quantity, 0);
}

// ─── 인터페이스 ───
export interface EditState {
    skus: SkuItem[];
    price: number;
    name: string;
    colorSelect: string;
    sizeSelect: string;
    colorCustom: string;
    sizeCustom: string;
}

export interface EditActions {
    setSkus: (skus: SkuItem[]) => void;
    setPrice: (price: number) => void;
    setName: (name: string) => void;
    setColorSelect: (v: string) => void;
    setSizeSelect: (v: string) => void;
    setColorCustom: (v: string) => void;
    setSizeCustom: (v: string) => void;
    addSku: () => void;
    removeSku: (index: number) => void;
}

export interface UseInventoryReturn {
    products: InventoryProduct[];
    loading: boolean;
    fetchInventory: () => Promise<void>;
    editingProduct: InventoryProduct | null;
    openEditModal: (product: InventoryProduct) => void;
    closeEditModal: () => void;
    editState: EditState;
    editActions: EditActions;
    handleDelete: (id: string) => Promise<void>;
    handleUpdateStock: () => Promise<void>;
    isUpdating: boolean;
}

export function useInventory(): UseInventoryReturn {
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // 모달 상태
    const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
    const [editSkus, setEditSkus] = useState<SkuItem[]>([]);
    const [editPrice, setEditPrice] = useState(0);
    const [editName, setEditName] = useState('');
    const [newColorSelect, setNewColorSelect] = useState('선택');
    const [newSizeSelect, setNewSizeSelect] = useState('선택');
    const [newColorCustom, setNewColorCustom] = useState('');
    const [newSizeCustom, setNewSizeCustom] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // 데이터 조회
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, image_url, colors, sizes, price, created_at')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Inventory fetch error:', error);
                toast.error('재고 목록을 불러오는데 실패했습니다.');
            } else {
                setProducts(data || []);
            }
        } catch (err) {
            console.error('Inventory fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // 삭제
    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 상품을 영구 삭제하시겠습니까?\n\nCloudinary 이미지/영상도 함께 삭제되며, 복구할 수 없습니다.')) return;
        try {
            const res = await fetch('/api/products?action=permanent', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            if (res.ok) {
                toast.success('상품이 영구 삭제되었습니다. (Cloudinary 리소스 포함)');
                fetchInventory();
            } else {
                toast.error('삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            toast.error('오류가 발생했습니다.');
        }
    };

    // 수정 저장
    const handleUpdateStock = async () => {
        if (!editingProduct) return;
        setIsUpdating(true);
        try {
            const mappedColors = editSkus.map(sku => ({ color: sku.name, quantity: sku.quantity }));
            const res = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, colors: mappedColors, sizes: [], price: editPrice }),
            });
            if (res.ok) {
                toast.success('재고가 수정되었습니다.');
                setEditingProduct(null);
                fetchInventory();
            } else {
                toast.error('재고 수정에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            toast.error('오류가 발생했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    // 모달 열기
    const openEditModal = (product: InventoryProduct) => {
        setEditingProduct(product);
        setEditSkus(buildSkuList(product));
        setEditPrice(product.price || 0);
        setEditName(product.name || '');
        setNewColorSelect('선택');
        setNewSizeSelect('선택');
        setNewColorCustom('');
        setNewSizeCustom('');
    };

    const closeEditModal = () => setEditingProduct(null);

    // SKU 추가
    const addSku = () => {
        const finalColor = newColorSelect === '직접 입력' ? newColorCustom.trim() : (newColorSelect === '선택' ? '' : newColorSelect);
        const finalSize = newSizeSelect === '직접 입력' ? newSizeCustom.trim() : (newSizeSelect === '선택' ? '' : newSizeSelect);

        if (!finalColor && !finalSize) {
            toast.error('색상 또는 사이즈를 선택/입력해주세요.');
            return;
        }

        const newSkuName = [finalColor, finalSize].filter(Boolean).join(' / ');
        if (editSkus.some(sku => sku.name.toLowerCase() === newSkuName.toLowerCase())) {
            toast.error('이미 존재하는 옵션입니다.');
            return;
        }

        setEditSkus(prev => [...prev, { name: newSkuName, quantity: 0 }]);

        const currentSizeIndex = SIZE_OPTIONS.indexOf(newSizeSelect);
        if (currentSizeIndex >= 1 && currentSizeIndex < SIZE_OPTIONS.length - 2) {
            setNewSizeSelect(SIZE_OPTIONS[currentSizeIndex + 1]);
        } else {
            setNewSizeSelect('선택');
            setNewSizeCustom('');
        }
    };

    // SKU 삭제
    const removeSku = (index: number) => {
        if (!confirm('이 옵션을 삭제하시겠습니까?')) return;
        setEditSkus(prev => prev.filter((_, i) => i !== index));
    };

    const editState: EditState = {
        skus: editSkus,
        price: editPrice,
        name: editName,
        colorSelect: newColorSelect,
        sizeSelect: newSizeSelect,
        colorCustom: newColorCustom,
        sizeCustom: newSizeCustom,
    };

    const editActions: EditActions = {
        setSkus: setEditSkus,
        setPrice: setEditPrice,
        setName: setEditName,
        setColorSelect: setNewColorSelect,
        setSizeSelect: setNewSizeSelect,
        setColorCustom: setNewColorCustom,
        setSizeCustom: setNewSizeCustom,
        addSku,
        removeSku,
    };

    return {
        products,
        loading,
        fetchInventory,
        editingProduct,
        openEditModal,
        closeEditModal,
        editState,
        editActions,
        handleDelete,
        handleUpdateStock,
        isUpdating,
    };
}
