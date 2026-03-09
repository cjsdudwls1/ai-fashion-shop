import { ChangeEvent } from 'react';
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/constants';
import type { ProductFormData } from '@/types/adminTypes';

interface BasicInfoSectionProps {
    formData: ProductFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onPriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function BasicInfoSection({ formData, onChange, onPriceChange }: BasicInfoSectionProps) {
    return (
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="mb-6">
                <label className="block text-lg font-semibold mb-2 text-[var(--text-primary)]">상품명 (Title)</label>
                <input
                    type="text" name="name" value={formData.name} onChange={onChange}
                    placeholder="예: 미니멀 울 코트"
                    className="input-field border border-[var(--border-color)] p-3 rounded-lg bg-[var(--bg-elevated)] w-full"
                />
            </div>

            <div className="mb-6">
                <label className="block text-lg font-semibold mb-2 text-[var(--text-primary)]">가격 (Price)</label>
                <input
                    type="text"
                    name="price"
                    value={formData.price ? Number(formData.price.toString().replace(/,/g, '')).toLocaleString() : ''}
                    onChange={onPriceChange}
                    placeholder="예: 59,000"
                    className="input-field border border-[var(--border-color)] p-3 rounded-lg bg-[var(--bg-elevated)] w-full"
                />
            </div>

            <div>
                <label className="block text-lg font-semibold mb-2 text-[var(--text-primary)]">소재 (Material / Fabric)</label>
                <input
                    type="text" name="fabric" value={formData.fabric} onChange={onChange}
                    placeholder="예: 캐시미어 100%"
                    className="input-field border border-[var(--border-color)] p-3 rounded-lg bg-[var(--bg-elevated)] w-full"
                />
            </div>

            <div className="mt-6">
                <label className="block text-lg font-semibold mb-2 text-[var(--text-primary)]">성별 (Gender)</label>
                <div className="admin-gender-group flex gap-4">
                    {[
                        { value: 'female', label: '여성 (Female)' },
                        { value: 'male', label: '남성 (Male)' },
                        { value: 'unisex', label: '남녀공용 (Unisex)' },
                    ].map((option) => (
                        <label key={option.value} className="flex items-center gap-[6px] text-lg cursor-pointer text-[var(--text-primary)]">
                            <input
                                type="radio"
                                name="gender"
                                value={option.value}
                                checked={formData.gender === option.value}
                                onChange={onChange}
                                className="accent-[var(--primary-color)]"
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-lg font-semibold mb-2 text-[var(--text-primary)]">카테고리 (Category)</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={onChange}
                    className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-lg text-[var(--text-primary)] cursor-pointer"
                >
                    <option value="" disabled>카테고리를 선택해주세요 (Select Category)</option>
                    {CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                            {group.keys.map((key) => (
                                <option key={key} value={key}>
                                    {CATEGORIES[key]?.ko} ({CATEGORIES[key]?.en || key})
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>
        </div>
    );
}
