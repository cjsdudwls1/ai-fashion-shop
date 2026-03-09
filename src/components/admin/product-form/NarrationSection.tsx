import type { NarrationOptionType } from '@/types/adminTypes';

interface NarrationSectionProps {
    selectedOption: NarrationOptionType;
    options: string[];
    customText: string;
    onOptionChange: (option: NarrationOptionType) => void;
    onCustomTextChange: (text: string) => void;
}

export default function NarrationSection({
    selectedOption,
    options,
    customText,
    onOptionChange,
    onCustomTextChange,
}: NarrationSectionProps) {
    return (
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] uppercase tracking-wider">모델 대사 (Narration)</h3>
            <p className="text-[15px] text-[var(--text-secondary)] mb-4 leading-relaxed">
                AI 영상에서 모델이 읊을 대사를 선택하세요. 상품 정보에 맞춰 추천됩니다.
            </p>

            <div className="flex flex-col gap-[10px]">
                {/* 추천 대사 3개 */}
                {options.map((text, idx) => {
                    const optionKey = `auto${idx + 1}` as NarrationOptionType;
                    const labels = ['프리미엄 감성', '트렌디 캐주얼', '실용성 강조'];
                    const isSelected = selectedOption === optionKey;
                    return (
                        <label
                            key={optionKey}
                            onClick={() => onOptionChange(optionKey)}
                            className={`flex items-start gap-3 cursor-pointer py-[14px] px-4 rounded-[10px] border transition-all duration-200 ${
                                isSelected
                                    ? 'border-2 border-[var(--primary-color)] bg-[var(--bg-elevated)]'
                                    : 'border border-[var(--border-color)] bg-transparent'
                            }`}
                        >
                            <div className={`w-[18px] h-[18px] rounded-full shrink-0 mt-[2px] bg-transparent ${
                                isSelected
                                    ? 'border-[5px] border-[var(--primary-color)]'
                                    : 'border border-[var(--text-secondary)]'
                            }`} />
                            <div className="flex-1">
                                <span className="text-sm font-semibold text-[var(--primary-color)] mb-1 block">
                                    {labels[idx]}
                                </span>
                                <span className="text-base text-[var(--text-primary)] leading-relaxed block">
                                    &quot;{text}&quot;
                                </span>
                            </div>
                        </label>
                    );
                })}

                {/* 직접 입력 옵션 */}
                <label
                    onClick={() => onOptionChange('custom')}
                    className={`flex items-start gap-3 cursor-pointer py-[14px] px-4 rounded-[10px] border transition-all duration-200 ${
                        selectedOption === 'custom'
                            ? 'border-2 border-[var(--primary-color)] bg-[var(--bg-elevated)]'
                            : 'border border-[var(--border-color)] bg-transparent'
                    }`}
                >
                    <div className={`w-[18px] h-[18px] rounded-full shrink-0 mt-[2px] bg-transparent ${
                        selectedOption === 'custom'
                            ? 'border-[5px] border-[var(--primary-color)]'
                            : 'border border-[var(--text-secondary)]'
                    }`} />
                    <div className="flex-1">
                        <span className="text-sm font-semibold text-[var(--primary-color)] mb-1 block">
                            직접 입력
                        </span>
                        <span className="text-[15px] text-[var(--text-secondary)]">
                            원하는 대사를 직접 작성합니다
                        </span>
                    </div>
                </label>

                {/* 직접 입력 텍스트 영역 */}
                {selectedOption === 'custom' && (
                    <div className="ml-[30px] mt-1">
                        <textarea
                            value={customText}
                            onChange={(e) => onCustomTextChange(e.target.value)}
                            placeholder='예: "이번 시즌 가장 핫한 블루셔츠! 편안한 착용감과 세련된 디자인을 동시에 만나보세요."'
                            rows={3}
                            autoFocus
                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-base text-[var(--text-primary)] resize-y font-inherit leading-relaxed"
                        />
                        <div className="mt-1.5 text-[13px] text-[var(--text-muted)]">
                            {customText.length > 0 ? `${customText.length}자 입력됨` : '대사를 입력해주세요'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
