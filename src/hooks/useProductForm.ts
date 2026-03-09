'use client';
import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinaryClient';
import { CATEGORY_MAP } from '@/lib/constants';
import { useStockForm } from './useStockForm';
import type {
    UploadedImage,
    ProductFormData,
    MediaGenerationType,
    VideoModelType,
    NarrationOptionType,
} from '@/types/adminTypes';

/**
 * 상품 등록 폼 상태 관리, 유효성 검증, 제출 로직을 캡슐화하는 커스텀 훅
 * [2026-03-06] 그룹 E 리팩토링: 재고 관련 로직을 useStockForm으로 위임
 * 외부 반환 인터페이스는 변경 없이 유지 (하위 호환)
 */
export function useProductForm() {
    const router = useRouter();

    // [2026-03-06] 그룹 E: 재고 관련 상태를 useStockForm으로 위임
    const stock = useStockForm();

    // 기본 폼 상태
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        fabric: '',
        price: '',
        gender: 'female',
        category: '',
    });

    // 제출 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 미디어 생성 옵션
    const [mediaGenerationType, setMediaGenerationType] = useState<MediaGenerationType>('video');
    const [videoModel, setVideoModel] = useState<VideoModelType>('veo-3.1-fast-generate-preview');

    // 나레이션 옵션
    const [narrationOption, setNarrationOption] = useState<NarrationOptionType>('auto1');
    const [customNarration, setCustomNarration] = useState('');

    // 추천 대사 동적 생성
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

    /** 폼 입력 변경 핸들러 */
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /** 가격 입력 변경 핸들러 */
    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(Number(value))) {
            setFormData(prev => ({ ...prev, price: value }));
        }
    };

    /** 폼 제출 핸들러 */
    const handleSubmit = async (e: FormEvent, images: UploadedImage[]) => {
        e.preventDefault();
        setError(null);

        // 유효성 검증
        if (!formData.name.trim()) { toast.error('상품명을 입력해주세요.'); return setError('상품명을 입력해주세요.'); }
        if (images.length === 0) { toast.error('최소 한 장 이상의 이미지를 업로드해주세요.'); return setError('최소 한 장 이상의 이미지를 업로드해주세요.'); }

        const mainImage = images.find(img => img.isMain) || images[0];
        if (!mainImage) { toast.error('대표 이미지를 설정해주세요.'); return setError('대표 이미지를 설정해주세요.'); }

        if (!formData.fabric.trim()) { toast.error('소재 정보를 입력해주세요.'); return setError('소재 정보를 입력해주세요.'); }
        if (!formData.price || parseInt(formData.price) < 0) { toast.error('유효한 가격을 입력해주세요.'); return setError('유효한 가격을 입력해주세요.'); }
        if (stock.stockList.length === 0) { toast.error('최소 하나 이상의 재고를 추가해주세요.'); return setError('최소 하나 이상의 재고를 추가해주세요.'); }

        setIsSubmitting(true);

        try {
            // 1. 이미지 업로드 (병렬 처리)
            const uploadPromises = images.map(async (img) => {
                if (img.file) {
                    const publicUrl = await uploadImageToCloudinary(img.file);
                    return { ...img, url: publicUrl };
                }
                return img;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const mainUploadedImage = uploadedImages.find(img => img.id === mainImage.id) || uploadedImages[0];

            // 2. 데이터 준비
            const colorMap = new Map<string, number>();
            stock.stockList.forEach(item => {
                colorMap.set(item.color, (colorMap.get(item.color) || 0) + item.quantity);
            });
            const colorsText = Array.from(colorMap.entries())
                .map(([color, qty]) => `${color}:${qty}`)
                .join('\n');

            const sizeMap = new Map<string, number>();
            stock.stockList.forEach(item => {
                sizeMap.set(item.size, (sizeMap.get(item.size) || 0) + item.quantity);
            });
            const sizesText = Array.from(sizeMap.entries())
                .map(([size, qty]) => `${size}:${qty}`)
                .join('\n');

            const galleryImages = uploadedImages.map(img => ({
                url: img.url || '',
                base64: '',
                color: img.color || undefined,
                isPrimary: img.isMain,
            }));

            // 3. API 요청
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    price: parseInt(formData.price),
                    imageUrl: mainUploadedImage.url,
                    imageBase64: '',
                    galleryImages,
                    fabric: formData.fabric,
                    gender: formData.gender,
                    category: formData.category,
                    colorsText,
                    sizesText,
                    mediaGenerationType,
                    videoModel: mediaGenerationType === 'video' ? videoModel : undefined,
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

    return {
        // 폼 상태
        formData,
        error,
        isSubmitting,
        // 재고 상태 (useStockForm에서 위임, 하위 호환 유지)
        ...stock,
        // 미디어 옵션
        mediaGenerationType,
        videoModel,
        narrationOption,
        customNarration,
        narrationOptions,
        // 상태 변경 함수
        setMediaGenerationType,
        setVideoModel,
        setNarrationOption,
        setCustomNarration,
        setFormData,
        // 핸들러
        handleInputChange,
        handlePriceChange,
        handleSubmit,
    };
}
