'use client';

/**
 * 범용 확인 모달
 * orders, inventory 등 다양한 페이지에서 재사용 가능.
 */
export interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDanger: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, confirmLabel, isDanger, onConfirm, onCancel }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed whitespace-pre-line">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-5 py-3 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
                        취소
                    </button>
                    <button onClick={onConfirm} className={`px-6 py-3 text-lg font-bold rounded-xl text-white transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
