'use client';

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProductForm } from '@/hooks/useProductForm';
import ImageUploader from '@/components/admin/ImageUploader';
import StockManager from '@/components/admin/StockManager';
import ProductForm from '@/components/admin/product-form';

export default function AdminPage() {
    const router = useRouter();

    // 커스텀 훅 호출
    const imageUpload = useImageUpload();
    const productForm = useProductForm();

    // 제출 핸들러 (이미지 데이터를 폼 훅에 전달)
    const onSubmit = (e: FormEvent) => {
        productForm.handleSubmit(e, imageUpload.images);
    };

    return (
        <div className="section-padding" style={{ background: 'var(--bg-elevated)', minHeight: '100vh', paddingBottom: '120px' }}>
            <div className="container-main" style={{ maxWidth: '1000px' }}>

                {/* 상단 액션 바 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 className="text-3xl font-bold flex items-center gap-4 text-[var(--text-primary)]">
                        <button onClick={() => router.back()} style={{ border: '1px solid var(--border-color)', padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-[var(--bg-elevated)] transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        상품 등록
                    </h1>
                </div>

                {/* 에러 표시 */}
                {productForm.error && (
                    <div style={{
                        padding: '16px', marginBottom: '32px', borderRadius: '12px',
                        border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '18px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                        <AlertCircle size={20} />
                        <div>
                            <div style={{ fontWeight: 600 }}>제출 오류</div>
                            <div>{productForm.error}</div>
                        </div>
                    </div>
                )}

                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-6">

                        {/* 이미지 업로드 */}
                        <ImageUploader
                            images={imageUpload.images}
                            isDragOver={imageUpload.isDragOver}
                            fileInputRef={imageUpload.fileInputRef}
                            handleRemoveImage={imageUpload.handleRemoveImage}
                            handleSetMainImage={imageUpload.handleSetMainImage}
                            handleFileChange={imageUpload.handleFileChange}
                            handleDragOver={imageUpload.handleDragOver}
                            handleDragLeave={imageUpload.handleDragLeave}
                            handleDrop={imageUpload.handleDrop}
                        />

                        {/* 기본 정보 + 미디어 옵션 + 나레이션 */}
                        <ProductForm
                            formData={productForm.formData}
                            mediaGenerationType={productForm.mediaGenerationType}
                            videoModel={productForm.videoModel}
                            narrationOption={productForm.narrationOption}
                            customNarration={productForm.customNarration}
                            narrationOptions={productForm.narrationOptions}
                            handleInputChange={productForm.handleInputChange}
                            handlePriceChange={productForm.handlePriceChange}
                            setMediaGenerationType={productForm.setMediaGenerationType}
                            setVideoModel={productForm.setVideoModel}
                            setNarrationOption={productForm.setNarrationOption}
                            setCustomNarration={productForm.setCustomNarration}
                        />

                        {/* 재고 관리 */}
                        <StockManager
                            stockList={productForm.stockList}
                            selectedColor={productForm.selectedColor}
                            selectedSize={productForm.selectedSize}
                            quantity={productForm.quantity}
                            setSelectedColor={productForm.setSelectedColor}
                            setSelectedSize={productForm.setSelectedSize}
                            setQuantity={productForm.setQuantity}
                            handleAddStock={productForm.handleAddStock}
                            handleRemoveStock={productForm.handleRemoveStock}
                        />

                    </div>

                    {/* 하단 액션 버튼 */}
                    <div className="admin-bottom-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px' }}>
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
                                cursor: 'pointer',
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={productForm.isSubmitting}
                            className="btn-primary"
                            style={{
                                padding: '10px 24px',
                                fontSize: '18px',
                                borderRadius: '8px',
                                minWidth: '100px',
                                background: '#1a1a1a',
                                color: '#fff',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                        >
                            {productForm.isSubmitting ? '저장 중...' : '상품 저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
