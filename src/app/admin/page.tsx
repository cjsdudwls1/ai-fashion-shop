'use client';

import { useState, useRef, ChangeEvent, FormEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

// 사전 정의된 색상 목록
const COMMON_COLORS = [
    { name: '블랙', hex: '#000000', text: '#fff' },
    { name: '화이트', hex: '#ffffff', text: '#000', border: true },
    { name: '네이비', hex: '#1a237e', text: '#fff' },
    { name: '차콜', hex: '#37474f', text: '#fff' },
    { name: '그레이', hex: '#9e9e9e', text: '#000' },
    { name: '베이지', hex: '#f5f5dc', text: '#000', border: true },
    { name: '아이보리', hex: '#fffff0', text: '#000', border: true },
    { name: '브라운', hex: '#795548', text: '#fff' },
    { name: '레드', hex: '#d32f2f', text: '#fff' },
    { name: '블루', hex: '#2196f3', text: '#fff' },
    { name: '그린', hex: '#4caf50', text: '#fff' },
    { name: '옐로우', hex: '#ffeb3b', text: '#000' },
    { name: '핑크', hex: '#f48fb1', text: '#fff' },
    { name: '퍼플', hex: '#9c27b0', text: '#fff' },
];

// 사전 정의된 사이즈 목록
const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'FREE'];

interface StockItem {
    id: number;
    color: string;
    size: string;
    quantity: number;
}

export default function AdminPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 기본 폼 상태
    const [formData, setFormData] = useState({
        name: '',
        fabric: '',
        gender: 'female' as 'female' | 'male',
        category: 'short-sleeve', // Default category
    });

    // 재고 관리 상태
    const [stockList, setStockList] = useState<StockItem[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 이미지 파일 처리
    const handleImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Image files only.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImagePreview(base64);
            setImageBase64(base64);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 재고 추가 핸들러
    const handleAddStock = () => {
        if (!selectedColor) return;
        if (!selectedSize) return;
        if (quantity < 1) return;

        const existingIndex = stockList.findIndex(
            item => item.color === selectedColor && item.size === selectedSize
        );

        if (existingIndex >= 0) {
            const newList = [...stockList];
            newList[existingIndex].quantity += quantity;
            setStockList(newList);
        } else {
            setStockList([
                ...stockList,
                {
                    id: Date.now(),
                    color: selectedColor,
                    size: selectedSize,
                    quantity: quantity
                }
            ]);
        }
        setQuantity(1);
    };

    const handleRemoveStock = (id: number) => {
        setStockList(stockList.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) return setError('Please enter a product name.');
        if (!imageBase64) return setError('Please upload a product image.');
        if (!formData.fabric.trim()) return setError('Please enter material info.');
        if (stockList.length === 0) return setError('Please add at least one variant.');

        setIsSubmitting(true);

        try {
            const colorMap = new Map<string, number>();
            stockList.forEach(item => {
                colorMap.set(item.color, (colorMap.get(item.color) || 0) + item.quantity);
            });
            const colorsText = Array.from(colorMap.entries())
                .map(([color, qty]) => `${color}:${qty}`)
                .join('\n');

            const sizeMap = new Map<string, number>();
            stockList.forEach(item => {
                sizeMap.set(item.size, (sizeMap.get(item.size) || 0) + item.quantity);
            });
            const sizesText = Array.from(sizeMap.entries())
                .map(([size, qty]) => `${size}:${qty}`)
                .join('\n');

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    imageBase64,
                    fabric: formData.fabric,
                    gender: formData.gender,
                    category: formData.category,
                    colorsText,
                    sizesText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to register product.');
            }

            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="section-padding" style={{ background: 'var(--bg-elevated)', minHeight: '100vh', paddingBottom: '120px' }}>
            <div className="container-main" style={{ maxWidth: '1000px' }}>

                {/* Top Action Bar (Shopify Style) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 className="text-2xl font-bold flex items-center gap-4">
                        <button onClick={() => router.back()} style={{ border: '1px solid var(--border-color)', padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-gray-50 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        상품 등록
                    </h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn-secondary"
                            style={{
                                padding: '10px 16px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-primary"
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                minWidth: '100px',
                                background: '#1a1a1a',
                                color: '#fff',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isSubmitting ? '저장 중...' : '상품 저장'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '16px', marginBottom: '32px', borderRadius: '12px',
                        border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '14px',
                        display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <div>
                            <div style={{ fontWeight: 600 }}>제출 오류</div>
                            <div>{error}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column (Left - 2/3) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Card 2: Media */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>상품 이미지 (Media)</label>
                            <div
                                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    height: '240px',
                                    background: imagePreview ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                            >
                                {imagePreview ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }} />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageBase64(''); }}
                                            style={{
                                                position: 'absolute', top: '12px', right: '12px',
                                                padding: '8px 12px', background: 'rgba(0,0,0,0.7)', color: '#fff',
                                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            marginBottom: '12px', width: '40px', height: '40px', margin: '0 auto 12px',
                                            borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-secondary)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                        </div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>이미지 업로드</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPEG, PNG, WEBP 파일 지원</p>
                                    </div>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        </div>

                        {/* Card 1: Basic Info */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>상품명 (Title)</label>
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleInputChange}
                                    placeholder="예: 미니멀 울 코트"
                                    className="input-field"
                                    style={{
                                        border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px',
                                        background: 'var(--bg-elevated)', width: '100%'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>소재 (Material / Fabric)</label>
                                <input
                                    type="text" name="fabric" value={formData.fabric} onChange={handleInputChange}
                                    placeholder="예: 캐시미어 100%"
                                    className="input-field"
                                    style={{
                                        border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px',
                                        background: 'var(--bg-elevated)', width: '100%'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Card 3: Variants */}
                        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>재고 및 옵션 (Variants)</h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stockList.length}개 옵션 추가됨</span>
                            </div>

                            <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                    {/* Option 1: Color */}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 1: 색상 (Color)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {COMMON_COLORS.map(c => (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(c.name)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        padding: '6px 12px', borderRadius: '30px',
                                                        border: selectedColor === c.name ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                                        background: selectedColor === c.name ? 'var(--bg-card)' : 'transparent',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.1)' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: selectedColor === c.name ? 600 : 400 }}>{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Option 2: Size */}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 2: 사이즈 (Size)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {COMMON_SIZES.map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setSelectedSize(s)}
                                                    style={{
                                                        padding: '8px 16px', fontSize: '13px', fontWeight: selectedSize === s ? 600 : 400,
                                                        background: selectedSize === s ? 'var(--text-primary)' : 'transparent',
                                                        color: selectedSize === s ? 'var(--bg-card)' : 'var(--text-primary)',
                                                        border: selectedSize === s ? '1px solid var(--text-primary)' : '1px solid var(--border-color)',
                                                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Option 3: Quantity & Add */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '8px' }}>
                                        <div style={{ width: '120px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>수량 (Quantity)</label>
                                            <input
                                                type="number" min="1" value={quantity}
                                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                style={{
                                                    width: '100%', padding: '10px', border: '1px solid var(--border-color)',
                                                    borderRadius: '8px', background: 'var(--bg-card)', fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddStock}
                                            disabled={!selectedColor || !selectedSize}
                                            className="btn-primary"
                                            style={{
                                                padding: '10px 24px', fontSize: '14px', height: '42px', borderRadius: '8px',
                                                opacity: (!selectedColor || !selectedSize) ? 0.5 : 1
                                            }}
                                        >
                                            옵션 추가
                                        </button>
                                    </div>

                                </div>
                            </div>

                            {/* Resource List Table */}
                            <div style={{ width: '100%' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>옵션명</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>재고 수량</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockList.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    추가된 옵션이 없습니다.
                                                </td>
                                            </tr>
                                        ) : (
                                            stockList.map(item => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: COMMON_COLORS.find(c => c.name === item.color)?.hex, border: '1px solid var(--border-color)' }} />
                                                            <span style={{ fontWeight: 500 }}>{item.color} <span style={{ color: 'var(--text-secondary)', margin: '0 4px' }}>/</span> {item.size}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>{item.quantity}개</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleRemoveStock(item.id)}
                                                            style={{
                                                                color: '#ef4444', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                                                                cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '6px'
                                                            }}
                                                            className="hover:bg-red-50 hover:border-red-500 transition-all"
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Secondary Column (Right - 1/3) */}
                    <div className="space-y-6">
                        {/* Card 4: Organization */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>상품 분류 (Organization)</h3>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>성별 (Gender)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {['female', 'male'].map((g) => (
                                        <label key={g} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            cursor: 'pointer', padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: formData.gender === g ? '1px solid var(--text-primary)' : '1px solid transparent',
                                            background: formData.gender === g ? 'var(--bg-elevated)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={formData.gender === g}
                                                onChange={handleInputChange}
                                                style={{ accentColor: 'var(--text-primary)' }}
                                            />
                                            <span style={{ fontSize: '14px', fontWeight: formData.gender === g ? 600 : 400 }}>{g === 'female' ? '여성 (Women)' : '남성 (Men)'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>카테고리 (Category)</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-elevated)', fontSize: '14px',
                                        color: 'var(--text-primary)', cursor: 'pointer'
                                    }}
                                >
                                    <optgroup label="상의 (Tops)">
                                        <option value="short-sleeve">반팔 (Short Sleeve)</option>
                                        <option value="long-sleeve">긴팔 (Long Sleeve)</option>
                                        <option value="sleeveless">민소매 (Sleeveless)</option>
                                        <option value="shirt">셔츠/블라우스 (Shirt)</option>
                                        <option value="knit">니트/스웨터 (Knit)</option>
                                        <option value="hoodie">후드/맨투맨 (Hoodie)</option>
                                    </optgroup>
                                    <optgroup label="하의 (Bottoms)">
                                        <option value="pants">긴바지 (Pants)</option>
                                        <option value="shorts">반바지 (Shorts)</option>
                                        <option value="skirt">스커트 (Skirt)</option>
                                        <option value="denim">데님/청바지 (Denim)</option>
                                        <option value="slacks">슬랙스 (Slacks)</option>
                                    </optgroup>
                                    <optgroup label="아우터 (Outerwear)">
                                        <option value="jacket">재킷/점퍼 (Jacket)</option>
                                        <option value="coat">코트 (Coat)</option>
                                        <option value="padding">패딩 (Padding)</option>
                                        <option value="cardigan">가디건 (Cardigan)</option>
                                    </optgroup>
                                    <optgroup label="기타 (Others)">
                                        <option value="onepiece">원피스 (Dress)</option>
                                        <option value="set">세트/투피스 (Set)</option>
                                        <option value="etc">기타/액세서리 (Etc)</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    고객이 상품을 쉽게 찾을 수 있도록 정확한 카테고리를 설정해주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
