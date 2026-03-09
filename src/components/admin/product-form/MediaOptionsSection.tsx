import type { MediaGenerationType } from '@/types/adminTypes';

interface MediaOptionsSectionProps {
    value: MediaGenerationType;
    onChange: (type: MediaGenerationType) => void;
}

export default function MediaOptionsSection({ value, onChange }: MediaOptionsSectionProps) {
    return (
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] uppercase tracking-wider">미디어 생성 옵션 (Media Generation)</h3>

            <div className="flex flex-col gap-3">
                {[
                    { value: 'video' as const, label: 'AI 동영상 생성', desc: '상품 이미지를 기반으로 AI 가상 피팅 + 패션 동영상 + 나레이션을 자동 생성합니다.', icon: '🎬' },
                    { value: 'image' as const, label: 'AI 이미지 생성', desc: 'AI 가상 피팅(Try-On) 이미지만 생성합니다. 동영상은 생성하지 않습니다.', icon: '🖼️' },
                    { value: 'none' as const, label: '미디어 생성 안 함', desc: 'AI 미디어를 생성하지 않고 상품만 등록합니다.', icon: '⏭️' },
                ].map((option) => (
                    <label
                        key={option.value}
                        className={`flex items-start gap-3 cursor-pointer p-4 rounded-lg border transition-all duration-200 ${
                            value === option.value 
                                ? 'border-2 border-[var(--primary-color)] bg-[var(--bg-elevated)]' 
                                : 'border border-[var(--border-color)] bg-transparent'
                        }`}
                        onClick={() => onChange(option.value)}
                    >
                        <div className={`w-[18px] h-[18px] rounded-full shrink-0 mt-[2px] bg-transparent ${
                            value === option.value
                                ? 'border-[5px] border-[var(--primary-color)]'
                                : 'border border-[var(--text-secondary)]'
                        }`} />
                        <div>
                            <span className="text-lg font-semibold block mb-1 text-[var(--text-primary)]">
                                {option.icon} {option.label}
                            </span>
                            <span className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                                {option.desc}
                            </span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
