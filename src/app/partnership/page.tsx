import { Phone } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';

export default function PartnershipPage() {
    return (
        <div className="section-padding min-h-screen">
            {/* CSS hover 효과용 스타일 - 서버 컴포넌트에서 이벤트 핸들러 사용 불가하므로 CSS로 대체 */}
            <style>{`
                .partnership-phone-link:hover {
                    opacity: 0.7;
                }
            `}</style>
            <div className="container-main max-w-2xl mx-auto">
                <div className="text-center mb-16 animate-fade-in">
                    <span className="badge badge-primary mb-4">CONTACT & FEEDBACK</span>
                    <h1 className="text-hero mb-6">
                        <span className="text-gradient">문의</span>
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        앱 이용 중 불편하신 점이나 건의사항, 도매 문의 등 무엇이든 자유롭게 남겨주세요.<br />
                        답변이 필요하신 경우 연락처나 이메일을 함께 기재해 주시면 감사하겠습니다.
                    </p>
                </div>

                <div className="form-container animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <ContactForm />
                </div>

                {/* 전화 문의 안내 */}
                <div className="animate-fade-in" style={{
                    animationDelay: '0.2s',
                    marginTop: '40px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px 36px',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                    }}>
                        <span style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                        }}>
                            또는 전화로 문의해 주세요
                        </span>
                        <a
                            href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-7773-1342'}`}
                            className="partnership-phone-link"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '22px',
                                fontWeight: 700,
                                color: 'var(--primary-color)',
                                textDecoration: 'none',
                                letterSpacing: '0.02em',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <Phone size={20} />
                            {process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-7773-1342'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
