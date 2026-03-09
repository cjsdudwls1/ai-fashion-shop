import type { VideoModelType } from '@/types/adminTypes';

interface VideoModelSectionProps {
    value: VideoModelType;
    onChange: (model: VideoModelType) => void;
}

export default function VideoModelSection({ value, onChange }: VideoModelSectionProps) {
    return (
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] mb-6">
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] uppercase tracking-wider">AI 영상 생성 모델 (Video Model)</h3>
            <p className="text-[15px] text-[var(--text-secondary)] mb-4 leading-relaxed">
                영상을 생성할 AI 모델을 선택하세요.
            </p>

            <div className="flex flex-col gap-3">
                {[
                    { value: 'veo-3.1-fast-generate-preview' as const, label: '빠른 생성 모델 (Fast)', desc: '720p 해상도로 빠르게 영상을 생성합니다. (Veo 3.1 Fast)' },
                    { value: 'veo-3.1-generate-preview' as const, label: '고품질 모델 (High Quality)', desc: '더욱 뛰어난 품질의 영상을 생성합니다. 생성 시간이 다소 길 수 있습니다. (Veo 3.1 최신 모델)' },
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
                            <span className="text-base font-semibold block mb-1 text-[var(--text-primary)]">
                                {option.label}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {option.desc}
                            </span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
