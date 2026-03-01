"use client";

import React, { useState } from 'react';

interface ShippingInfo {
    name: string;
    phone: string;
    zonecode: string;
    roadAddress: string;
    detailAddress: string;
    memo: string;
}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 받는 분 */}
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        주소
                    </label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <input
                            type="text"
                            readOnly
                            placeholder="우편번호"
                            className="checkout-input"
                            style={{ width: '120px', flexShrink: 0, cursor: 'pointer', textAlign: 'center' }}
                            value={shippingInfo.zonecode}
                            onClick={() => setOpenPostcode(true)}
                        />
                        <button
                            type="button"
                            onClick={() => setOpenPostcode(true)}
                            style={{
                                flex: 1,
                                height: '48px',
                                whiteSpace: 'nowrap',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-dark)',
                                padding: '0 20px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '14px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                            주소 검색
                        </button>
                    </div>
                    {shippingInfo.roadAddress && (
                        <input
                            type="text"
                            readOnly
                            className="checkout-input"
                            style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                            className="checkout-input"
                            style={{ marginTop: '12px' }}
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
