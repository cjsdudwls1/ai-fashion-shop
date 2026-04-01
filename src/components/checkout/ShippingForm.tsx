"use client";

import React, { useState } from 'react';
import { ShippingInfo } from '@/types/order';

interface ShippingFormProps {
    shippingInfo: ShippingInfo;
    setShippingInfo: React.Dispatch<React.SetStateAction<ShippingInfo>>;
    setOpenPostcode: (open: boolean) => void;
    fieldErrors?: Record<string, string>;
    onBlur?: (fieldName: string) => void;
}

const MEMO_OPTIONS = [
    "문 앞에 놔주세요",
    "배송 전 연락바랍니다",
    "경비실에 맡겨주세요",
    "부재 시 문앞에 놔주세요"
];

export default function ShippingForm({ shippingInfo, setShippingInfo, setOpenPostcode, fieldErrors = {}, onBlur }: ShippingFormProps) {
    const [isCustomMemo, setIsCustomMemo] = useState(() => {
        return shippingInfo.memo && !MEMO_OPTIONS.includes(shippingInfo.memo) ? true : false;
    });

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'custom') {
            setIsCustomMemo(true);
            setShippingInfo({ ...shippingInfo, memo: '' });
        } else {
            setIsCustomMemo(false);
            setShippingInfo({ ...shippingInfo, memo: val });
        }
    };

    return (
        <section className="checkout-section">
            <h2 className="checkout-section-title">배송지 정보</h2>
            <div className="flex flex-col gap-5">
                {/* 받는 분 */}
                <div>
                    <label className="block text-[14px] font-medium text-[var(--text-secondary)] mb-2">
                        받는 분
                    </label>
                    <input
                        type="text"
                        required
                        className={`checkout-input ${fieldErrors.name ? 'input-error' : ''}`}
                        placeholder="이름 입력"
                        value={shippingInfo.name}
                        onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                        onBlur={() => onBlur?.('name')}
                    />
                    {fieldErrors.name && (
                        <p className="checkout-input-error-msg">{fieldErrors.name}</p>
                    )}
                </div>

                {/* 연락처 */}
                <div>
                    <label className="block text-[14px] font-medium text-[var(--text-secondary)] mb-2">
                        연락처
                    </label>
                    <input
                        type="tel"
                        required
                        placeholder="010-0000-0000"
                        className={`checkout-input ${fieldErrors.phone ? 'input-error' : ''}`}
                        value={shippingInfo.phone}
                        onChange={e => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        onBlur={() => onBlur?.('phone')}
                    />
                    {fieldErrors.phone && (
                        <p className="checkout-input-error-msg">{fieldErrors.phone}</p>
                    )}
                </div>

                {/* 주소 */}
                <div>
                    <label className="block text-[14px] font-medium text-[var(--text-secondary)] mb-2">
                        주소
                    </label>
                    <div className="flex gap-3 mb-3">
                        <input
                            type="text"
                            readOnly
                            placeholder="우편번호"
                            className="checkout-input flex-1 cursor-pointer text-center"
                            value={shippingInfo.zonecode}
                            onClick={() => setOpenPostcode(true)}
                        />
                        <button
                            type="button"
                            onClick={() => setOpenPostcode(true)}
                            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-dark)' }}
                            className="w-[100px] flex-shrink-0 h-[48px] whitespace-nowrap px-3 rounded-[var(--radius-md)] text-[14px] font-bold border-none cursor-pointer transition-opacity duration-200 hover:opacity-90"
                        >
                            주소 검색
                        </button>
                    </div>
                    {shippingInfo.roadAddress && (
                        <input
                            type="text"
                            readOnly
                            className="checkout-input mb-3 text-[var(--text-secondary)]"
                            value={shippingInfo.roadAddress}
                        />
                    )}
                    <input
                        type="text"
                        placeholder="상세 주소 입력 (동/호수 등)"
                        className={`checkout-input ${fieldErrors.detailAddress ? 'input-error' : ''}`}
                        value={shippingInfo.detailAddress}
                        onChange={e => setShippingInfo({ ...shippingInfo, detailAddress: e.target.value })}
                        onBlur={() => onBlur?.('detailAddress')}
                    />
                    {fieldErrors.detailAddress && (
                        <p className="checkout-input-error-msg">{fieldErrors.detailAddress}</p>
                    )}
                </div>

                {/* 배송 메모 */}
                <div>
                    <label className="block text-[14px] font-medium text-[var(--text-secondary)] mb-2">
                        배송 메모
                    </label>
                    <select
                        className="checkout-select"
                        onChange={handleSelectChange}
                        value={isCustomMemo ? "custom" : shippingInfo.memo}
                    >
                        <option value="">배송 시 요청사항을 선택해주세요</option>
                        {MEMO_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="custom">직접 입력</option>
                    </select>

                    {isCustomMemo && (
                        <input
                            type="text"
                            className="checkout-input mt-3"
                            placeholder="배송 메모를 직접 입력해주세요"
                            value={shippingInfo.memo}
                            onChange={e => setShippingInfo({ ...shippingInfo, memo: e.target.value })}
                            autoFocus
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
