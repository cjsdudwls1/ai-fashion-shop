'use client';

import { useState, useRef, useMemo, ChangeEvent, FormEvent, DragEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

import imageCompression from 'browser-image-compression';
import { uploadImageToCloudinary } from '@/lib/clientCloudinaryUtils';
import { CATEGORY_MAP, COMMON_COLORS, COMMON_SIZES } from '@/lib/constants';

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
        price: '', // price input as string to handle empty state conveniently
        gender: 'female' as 'female' | 'male' | 'unisex',
        category: '', // Default category
    });

    // 재고 관리 상태
    const [stockList, setStockList] = useState<StockItem[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number | string>(1);

    interface UploadedImage {
        id: string;
        file: File | null; // null if already uploaded/url based (though here we process files)
        preview: string;
        url?: string; // Add URL field for storage url
        isMain: boolean;
        color?: string;
    }
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 미디어 생성 옵션 (기본: 동영상 생성)
    const [mediaGenerationType, setMediaGenerationType] = useState<'video' | 'image' | 'none'>('video');

    // AI 영상 생성 모델 선택
    const [videoModel, setVideoModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');

    // 모델 나레이션 대사 선택 (추천 3개 + 직접 입력)
    const [narrationOption, setNarrationOption] = useState<'auto1' | 'auto2' | 'auto3' | 'custom'>('auto1');
    const [customNarration, setCustomNarration] = useState('');

    // 상품 정보에 따라 추천 대사 동적 생성
    const narrationOptions = useMemo(() => {
        const name = formData.name || '상품명';
        const fabric = formData.fabric || '프리미엄 소재';
        const catKr = CATEGORY_MAP[formData.category] || '패션 아이템';
        return [
            `${name}. ${fabric} 소재로 완성한 프리미엄 ${catKr}, 지금 만나보세요.`,
            `이번 시즌 가장 핫한 ${name}! ${fabric}의 편안한 착용감을 경험해보세요.`,
            `${fabric} 소재의 ${name}, 스타일과 실용성을 동시에 갖춘 ${catKr}입니다.`,
        ];
    }, [formData.name, formData.fabric, formData.category]);



    // 이미지 압축 및 처리
    const handleImageFiles = async (files: FileList | null) => {
        if (!files) return;

        const newImages: UploadedImage[] = [];

        const options = {
            maxSizeMB: 1, // 최대 1MB
            maxWidthOrHeight: 1920, // FHD 해상도 제한
            useWebWorker: true,
            fileType: 'image/webp' // WebP로 변환
        };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            try {
                // 1. 압축
                const compressedFile = await imageCompression(file, options);

                // 2. 미리보기 생성
                const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);

                newImages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file: compressedFile, // 압축된 파일 저장
                    preview: previewUrl,
                    isMain: false,
                    color: ''
                });
            } catch (err) {
                console.error('Image compression error:', err);
                toast.error(`${file.name} 처리 중 오류가 발생했습니다.`);
            }
        }

        setImages(prev => {
            const combined = [...prev, ...newImages];
            // 대표 이미지가 없으면 첫 번째 이미지를 대표로 설정
            if (combined.length > 0 && !combined.some(img => img.isMain)) {
                combined[0].isMain = true;
            }
            return combined;
        });
        setError(null);
    };

    const handleRemoveImage = (id: string) => {
        setImages(prev => {
            const filtered = prev.filter(img => img.id !== id);
            // 대표 이미지를 삭제했다면 첫 번째 이미지를 대표로 설정
            if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
                filtered[0].isMain = true;
            }
            return filtered;
        });
    };

    const handleSetMainImage = (id: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            isMain: img.id === id
        })));
    };

    const handleSetImageColor = (id: string, color: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            color: img.id === id ? color : img.color
        })));
    };



    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleImageFiles(e.target.files);
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
        handleImageFiles(e.dataTransfer.files);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 재고 추가 핸들러
    const handleAddStock = () => {
        if (!selectedColor) return;
        if (!selectedSize) return;

        const qty = Number(quantity);
        if (isNaN(qty) || qty < 1) {
            toast.error('유효한 수량을 입력해주세요.');
            return;
        }

        const existingIndex = stockList.findIndex(
            item => item.color === selectedColor && item.size === selectedSize
        );

        if (existingIndex >= 0) {
            const newList = [...stockList];
            newList[existingIndex].quantity += qty;
            setStockList(newList);
        } else {
            setStockList([
                ...stockList,
                {
                    id: Date.now(),
                    color: selectedColor,
                    size: selectedSize,
                    quantity: qty
                }
            ]);
        }
        setQuantity(1);
    };

    const handleRemoveStock = (id: number) => {
        setStockList(stockList.filter(item => item.id !== id));
    };

    // Cloudinary 업로드는 src/lib/clientCloudinaryUtils.ts 의 uploadImageToCloudinary 사용

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.name.trim()) { toast.error('상품명을 입력해주세요.'); return setError('상품명을 입력해주세요.'); }
        if (images.length === 0) { toast.error('최소 한 장 이상의 이미지를 업로드해주세요.'); return setError('최소 한 장 이상의 이미지를 업로드해주세요.'); }

        const mainImage = images.find(img => img.isMain) || images[0];
        if (!mainImage) { toast.error('대표 이미지를 설정해주세요.'); return setError('대표 이미지를 설정해주세요.'); }

        if (!formData.fabric.trim()) { toast.error('소재 정보를 입력해주세요.'); return setError('소재 정보를 입력해주세요.'); }
        if (!formData.price || parseInt(formData.price) < 0) { toast.error('유효한 가격을 입력해주세요.'); return setError('유효한 가격을 입력해주세요.'); }
        if (stockList.length === 0) { toast.error('최소 하나 이상의 재고를 추가해주세요.'); return setError('최소 하나 이상의 재고를 추가해주세요.'); }

        setIsSubmitting(true);

        try {
            // 1. 이미지 업로드 (병렬 처리)
            const uploadPromises = images.map(async (img) => {
                if (img.file) {
                    const publicUrl = await uploadImageToCloudinary(img.file);
                    return { ...img, url: publicUrl };
                }
                return img; // 이미 URL이 있는 경우 (수정 시 등 - 현재는 신규만 고려)
            });

            // 모든 이미지 업로드 대기
            const uploadedImages = await Promise.all(uploadPromises);

            // 업로드 완료 후 URL이 포함된 상태로 메인 이미지 찾기
            const mainUplodedImage = uploadedImages.find(img => img.id === mainImage.id) || uploadedImages[0];

            // 2. 데이터 준비
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

            // 갤러리 이미지 구성 (URL 사용)
            const galleryImages = uploadedImages.map(img => ({
                url: img.url || '', // Use Storage URL
                base64: '', // No longer sending base64
                color: img.color || undefined,
                isPrimary: img.isMain
            }));

            // 3. API 요청
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    price: parseInt(formData.price),
                    imageUrl: mainUplodedImage.url, // Send URL instead of Base64
                    imageBase64: '', // Deprecated
                    galleryImages, // Gallery Images with URLs
                    fabric: formData.fabric,
                    gender: formData.gender,
                    category: formData.category,

                    colorsText,
                    sizesText,
                    mediaGenerationType,
                    videoModel: mediaGenerationType === 'video' ? videoModel : undefined, // 여기서 값 전달
                    narrationText: narrationOption === 'custom'
                        ? (customNarration.trim() || undefined)
                        : narrationOptions[parseInt(narrationOption.replace('auto', '')) - 1],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to register product.');
            }

            toast.success('상품이 성공적으로 등록되었습니다.');
            router.push('/products');
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An error occurred during upload.';
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="section-padding" style={{ background: 'var(--bg-elevated)', minHeight: '100vh', paddingBottom: '120px' }}>
            <div className="container-main" style={{ maxWidth: '1000px' }}>

                {/* Top Action Bar (Shopify Style) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 className="text-3xl font-bold flex items-center gap-4 text-[var(--text-primary)]">
                        <button onClick={() => router.back()} style={{ border: '1px solid var(--border-color)', padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-[var(--bg-elevated)] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        상품 등록
                    </h1>
                </div>

                {error && (
                    <div style={{
                        padding: '16px', marginBottom: '32px', borderRadius: '12px',
                        border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '18px',
                        display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <div>
                            <div style={{ fontWeight: 600 }}>제출 오류</div>
                            <div>{error}</div>
                        </div>
                    </div>
                )}

                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Main Column (Centered) */}
                    <div className="space-y-6">

                        {/* Card 2: Media */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>상품 이미지 (Media)</label>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{images.length}장 업로드됨 (첫 번째 이미지가 대표 이미지)</span>
                            </div>

                            {/* Upload Zone */}
                            <div
                                className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    height: images.length > 0 ? '120px' : '240px',
                                    background: 'var(--bg-elevated)',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    marginBottom: '24px'
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        marginBottom: '12px', width: '40px', height: '40px', margin: '0 auto 12px',
                                        borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-secondary)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                    </div>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {images.length > 0 ? '이미지 추가하기' : '이미지 업로드'}
                                    </p>
                                    <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>드래그 앤 드롭 또는 클릭하여 선택 (다중 선택 가능)</p>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

                            {/* Image Grid */}
                            {images.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                                    {images.map((img, idx) => (
                                        <div key={img.id} style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: img.isMain ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                            background: 'var(--bg-elevated)'
                                        }}>
                                            {/* Preview */}
                                            <div style={{ position: 'relative', aspectRatio: '3/4', width: '100%' }}>
                                                <img src={img.preview} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                                                    style={{
                                                        position: 'absolute', top: '8px', right: '8px',
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                </button>
                                                {/* Main Badge */}
                                                {img.isMain && (
                                                    <div style={{
                                                        position: 'absolute', top: '8px', left: '8px',
                                                        padding: '5px 10px', borderRadius: '4px',
                                                        background: 'var(--primary-color)', color: '#fff',
                                                        fontSize: '13px', fontWeight: 700
                                                    }}>
                                                        대표
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ padding: '12px' }}>
                                                {/* Set Main */}
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="mainImage"
                                                        checked={img.isMain}
                                                        onChange={() => handleSetMainImage(img.id)}
                                                        style={{ accentColor: 'var(--primary-color)' }}
                                                    />
                                                    <span style={{ fontSize: '16px', fontWeight: 500 }}>대표 이미지 설정</span>
                                                </label>

                                                {/* Set Color Select Removed */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Card 1: Basic Info */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>상품명 (Title)</label>
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

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>가격 (Price)</label>
                                <input
                                    type="text"
                                    name="price"
                                    value={formData.price ? Number(formData.price.toString().replace(/,/g, '')).toLocaleString() : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/,/g, '');
                                        if (!isNaN(Number(value))) {
                                            setFormData(prev => ({ ...prev, price: value }));
                                        }
                                    }}
                                    placeholder="예: 59,000"
                                    className="input-field"
                                    style={{
                                        border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px',
                                        background: 'var(--bg-elevated)', width: '100%'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>소재 (Material / Fabric)</label>
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

                            {/* Gender Selection */}
                            <div style={{ marginTop: '24px' }}>
                                <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>성별 (Gender)</label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {[
                                        { value: 'female', label: '여성 (Female)' },
                                        { value: 'male', label: '남성 (Male)' },
                                        { value: 'unisex', label: '남녀공용 (Unisex)' }
                                    ].map((option) => (
                                        <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={option.value}
                                                checked={formData.gender === option.value}
                                                onChange={handleInputChange}
                                                style={{ accentColor: 'var(--primary-color)' }}
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div style={{ marginTop: '24px' }}>
                                <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>카테고리 (Category)</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-elevated)', fontSize: '18px',
                                        color: 'var(--text-primary)', cursor: 'pointer'
                                    }}
                                >
                                    <option value="" disabled>카테고리를 선택해주세요 (Select Category)</option>
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
                                        <option value="underwear">속옷/언더웨어 (Underwear)</option>
                                        <option value="etc">기타/액세서리 (Etc)</option>
                                    </optgroup>

                                </select>
                            </div>
                        </div>


                        {/* Card: Media Generation Option */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>미디어 생성 옵션 (Media Generation)</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { value: 'video' as const, label: 'AI 동영상 생성', desc: '상품 이미지를 기반으로 AI 가상 피팅 + 패션 동영상 + 나레이션을 자동 생성합니다.', icon: '🎬' },
                                    { value: 'image' as const, label: 'AI 이미지 생성', desc: 'AI 가상 피팅(Try-On) 이미지만 생성합니다. 동영상은 생성하지 않습니다.', icon: '🖼️' },
                                    { value: 'none' as const, label: '미디어 생성 안 함', desc: 'AI 미디어를 생성하지 않고 상품만 등록합니다.', icon: '⏭️' },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                            cursor: 'pointer', padding: '16px',
                                            borderRadius: '8px',
                                            border: mediaGenerationType === option.value ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                            background: mediaGenerationType === option.value ? 'var(--bg-elevated)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setMediaGenerationType(option.value)}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                                            border: mediaGenerationType === option.value ? '5px solid var(--primary-color)' : '1px solid var(--text-secondary)',
                                            background: 'transparent'
                                        }} />
                                        <div>
                                            <span style={{ fontSize: '18px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                {option.icon} {option.label}
                                            </span>
                                            <span style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                {option.desc}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Card: Video Model Selection (동영상 생성 선택 시에만 표시) */}
                        {mediaGenerationType === 'video' && (
                            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI 영상 생성 모델 (Video Model)</h3>
                                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                    영상을 생성할 AI 모델을 선택하세요.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { value: 'veo-3.1-fast-generate-preview' as const, label: '빠른 생성 모델 (Fast)', desc: '720p 해상도로 빠르게 영상을 생성합니다. (Veo 3.1 Fast)' },
                                        { value: 'veo-3.1-generate-preview' as const, label: '고품질 모델 (High Quality)', desc: '더욱 뛰어난 품질의 영상을 생성합니다. 생성 시간이 다소 길 수 있습니다. (Veo 3.1 최신 모델)' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                cursor: 'pointer', padding: '16px',
                                                borderRadius: '8px',
                                                border: videoModel === option.value ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                background: videoModel === option.value ? 'var(--bg-elevated)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => setVideoModel(option.value)}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                                                border: videoModel === option.value ? '5px solid var(--primary-color)' : '1px solid var(--text-secondary)',
                                                background: 'transparent'
                                            }} />
                                            <div>
                                                <span style={{ fontSize: '16px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                    {option.label}
                                                </span>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                    {option.desc}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Card: Narration Selection (동영상 생성 선택 시에만 표시) */}
                        {mediaGenerationType === 'video' && (
                            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>모델 대사 (Narration)</h3>
                                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                    AI 영상에서 모델이 읊을 대사를 선택하세요. 상품 정보에 맞춰 추천됩니다.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* 추천 대사 3개 */}
                                    {narrationOptions.map((text, idx) => {
                                        const optionKey = `auto${idx + 1}` as 'auto1' | 'auto2' | 'auto3';
                                        const labels = ['프리미엄 감성', '트렌디 캐주얼', '실용성 강조'];
                                        const isSelected = narrationOption === optionKey;
                                        return (
                                            <label
                                                key={optionKey}
                                                onClick={() => setNarrationOption(optionKey)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                    cursor: 'pointer', padding: '14px 16px',
                                                    borderRadius: '10px',
                                                    border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                    background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                                                    border: isSelected ? '5px solid var(--primary-color)' : '1px solid var(--text-secondary)',
                                                    background: 'transparent'
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px', display: 'block' }}>
                                                        {labels[idx]}
                                                    </span>
                                                    <span style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: '1.5', display: 'block' }}>
                                                        "{text}"
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}

                                    {/* 직접 입력 옵션 */}
                                    <label
                                        onClick={() => setNarrationOption('custom')}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                            cursor: 'pointer', padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: narrationOption === 'custom' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                            background: narrationOption === 'custom' ? 'var(--bg-elevated)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                                            border: narrationOption === 'custom' ? '5px solid var(--primary-color)' : '1px solid var(--text-secondary)',
                                            background: 'transparent'
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px', display: 'block' }}>
                                                직접 입력
                                            </span>
                                            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                                                원하는 대사를 직접 작성합니다
                                            </span>
                                        </div>
                                    </label>

                                    {/* 직접 입력 텍스트 영역 */}
                                    {narrationOption === 'custom' && (
                                        <div style={{ marginLeft: '30px', marginTop: '4px' }}>
                                            <textarea
                                                value={customNarration}
                                                onChange={(e) => setCustomNarration(e.target.value)}
                                                placeholder='예: "이번 시즌 가장 핫한 블루셔츠! 편안한 착용감과 세련된 디자인을 동시에 만나보세요."'
                                                rows={3}
                                                autoFocus
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)', fontSize: '16px',
                                                    color: 'var(--text-primary)', resize: 'vertical',
                                                    fontFamily: 'inherit', lineHeight: '1.6'
                                                }}
                                            />
                                            <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {customNarration.length > 0 ? `${customNarration.length}자 입력됨` : '대사를 입력해주세요'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Card 3: Variants */}
                        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>재고 (Stock)</h3>
                                <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{stockList.length}개 옵션 추가됨</span>
                            </div>

                            <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                    {/* Option 1: Color */}
                                    <div>
                                        <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 1: 색상 (Color)</label>
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
                                                    <span style={{ fontSize: '16px', fontWeight: selectedColor === c.name ? 600 : 400 }}>{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Option 2: Size */}
                                    <div>
                                        <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>옵션 2: 사이즈 (Size)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {COMMON_SIZES.map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setSelectedSize(s)}
                                                    style={{
                                                        padding: '8px 16px', fontSize: '16px', fontWeight: selectedSize === s ? 600 : 400,
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
                                            <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>수량 (Quantity)</label>
                                            <input
                                                type="number" min="1" value={quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '') setQuantity('');
                                                    else setQuantity(parseInt(val));
                                                }}
                                                style={{
                                                    width: '100%', padding: '10px', border: '1px solid var(--border-color)',
                                                    borderRadius: '8px', background: 'var(--bg-card)', fontSize: '18px'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddStock}
                                            disabled={!selectedColor || !selectedSize}
                                            className="btn-primary"
                                            style={{
                                                padding: '12px 24px', fontSize: '18px', height: '46px', borderRadius: '8px',
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '18px' }}>
                                    <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>옵션명</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>재고 수량</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>관리</th>
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
                                                                cursor: 'pointer', fontSize: '16px', padding: '8px 14px', borderRadius: '6px'
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

                    {/* Bottom Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px' }}>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn-secondary"
                            style={{
                                padding: '10px 16px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                borderRadius: '8px',
                                fontSize: '18px',
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
                                fontSize: '18px',
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
            </div>
        </div >
    );
}
