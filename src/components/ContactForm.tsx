'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

export function ContactForm() {
    // [2026-03-06] 그룹 G: Formspree ID 환경변수 전환
    const [state, handleSubmit] = useForm(process.env.NEXT_PUBLIC_FORMSPREE_ID || "xojndnaz");

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
        <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            <div>
                <label htmlFor="message" className="block text-sm font-medium" style={{ marginBottom: '8px', display: 'block' }}>
                    문의 내용 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="input-field w-full resize-none"
                    placeholder="문의 내용을 적어주세요..."
                    required
                />
                <ValidationError
                    prefix="Message"
                    field="message"
                    errors={state.errors}
                    className="text-red-500 text-sm"
                    style={{ marginTop: '4px', display: 'block' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <span style={{ color: '#ef4444' }}>*</span> 표시는 필수 입력 항목입니다.
                </p>
            </div>

            <button
                type="submit"
                disabled={state.submitting}
                className="btn-primary w-full"
                style={{ marginTop: '32px', opacity: state.submitting ? 0.5 : 1, cursor: state.submitting ? 'not-allowed' : 'pointer' }}
            >
                {state.submitting ? '전송 중...' : '문의하기'}
            </button>

            {state.errors && (
                <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginTop: '8px' }}>
                    메시지 전송 중 오류가 발생했습니다. 다시 시도해 주세요.
                </div>
            )}
        </form>
    );
}
