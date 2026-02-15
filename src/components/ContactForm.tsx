'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

export function ContactForm() {
    const [state, handleSubmit] = useForm("xojndnaz");

    if (state.succeeded) {
        return (
            <div className="glass-card p-8 text-center animate-fade-in">
                <h3 className="text-xl font-medium mb-2">문의해주셔서 감사합니다!</h3>
                <p className="text-[var(--text-secondary)]">
                    메시지가 성공적으로 전송되었습니다. 검토 후 빠른 시일 내에 답변 드리겠습니다.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="contact" className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                    전화번호 또는 이메일 주소
                </label>
                <input
                    id="contact"
                    type="text"
                    name="contact"
                    className="input-field w-full"
                    placeholder="010-0000-0000 또는 your@email.com"
                    required
                />
                <ValidationError
                    prefix="Contact"
                    field="contact"
                    errors={state.errors}
                    className="text-red-500 text-sm mt-1"
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                    문의 내용
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="input-field w-full resize-none"
                    placeholder="비지니스 제휴 및 도매 후 직판 관련 문의 내용을 적어주세요..."
                    required
                />
                <ValidationError
                    prefix="Message"
                    field="message"
                    errors={state.errors}
                    className="text-red-500 text-sm mt-1"
                />
            </div>

            <button
                type="submit"
                disabled={state.submitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {state.submitting ? '전송 중...' : '문의하기'}
            </button>

            {state.errors && (
                <div className="text-red-500 text-sm text-center mt-2">
                    메시지 전송 중 오류가 발생했습니다. 다시 시도해 주세요.
                </div>
            )}
        </form>
    );
}
