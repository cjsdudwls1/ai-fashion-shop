"use client";

import React from 'react';

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
}

export default function ShippingForm({ shippingInfo, setShippingInfo, setOpenPostcode }: ShippingFormProps) {
    return (
        <section className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">배송지 정보</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">받는 분</label>
                    <input
                        type="text"
                        required
                        className="w-full border-[var(--border-color)] rounded-xl shadow-sm focus:ring-[var(--text-primary)] focus:border-[var(--text-primary)] p-3 border bg-[var(--bg-dark)] text-[var(--text-primary)] outline-none"
                        placeholder="이름 입력"
                        value={shippingInfo.name}
                        onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">연락처</label>
                    <input
                        type="tel"
                        required
                        placeholder="010-0000-0000"
                        className="w-full border-[var(--border-color)] rounded-xl shadow-sm focus:ring-[var(--text-primary)] focus:border-[var(--text-primary)] p-3 border bg-[var(--bg-dark)] text-[var(--text-primary)] outline-none"
                        value={shippingInfo.phone}
                        onChange={e => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">주소</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            readOnly
                            placeholder="우편번호"
                            className="w-28 border-[var(--border-color)] rounded-xl shadow-sm bg-[var(--bg-elevated)] p-3 border cursor-pointer text-[var(--text-primary)] outline-none"
                            value={shippingInfo.zonecode}
                            onClick={() => setOpenPostcode(true)}
                        />
                        <button
                            type="button"
                            onClick={() => setOpenPostcode(true)}
                            className="bg-[var(--text-primary)] text-[var(--bg-dark)] px-5 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                        >
                            주소 검색
                        </button>
                    </div>
                    {shippingInfo.roadAddress && (
                        <input
                            type="text"
                            readOnly
                            className="w-full border-[var(--border-color)] rounded-xl shadow-sm bg-[var(--bg-elevated)] p-3 border mb-2 text-[var(--text-secondary)] outline-none"
                            value={shippingInfo.roadAddress}
                        />
                    )}
                    <input
                        type="text"
                        placeholder="상세 주소 입력 (동/호수 등)"
                        className="w-full border-[var(--border-color)] rounded-xl shadow-sm focus:ring-[var(--text-primary)] focus:border-[var(--text-primary)] p-3 border bg-[var(--bg-dark)] text-[var(--text-primary)] outline-none"
                        value={shippingInfo.detailAddress}
                        onChange={e => setShippingInfo({ ...shippingInfo, detailAddress: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">배송 메모</label>
                    <select
                        className="w-full border-[var(--border-color)] rounded-xl shadow-sm focus:ring-[var(--text-primary)] focus:border-[var(--text-primary)] p-3 border bg-[var(--bg-dark)] text-[var(--text-primary)] outline-none"
                        onChange={e => setShippingInfo({ ...shippingInfo, memo: e.target.value })}
                        value={shippingInfo.memo}
                    >
                        <option value="">배송 시 요청사항을 선택해주세요</option>
                        <option value="문 앞에 놔주세요">문 앞에 놔주세요</option>
                        <option value="배송 전 연락바랍니다">배송 전 연락바랍니다</option>
                        <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
                        <option value="부재 시 문앞에 놔주세요">부재 시 문앞에 놔주세요</option>
                    </select>
                </div>
            </div>
        </section>
    );
}
