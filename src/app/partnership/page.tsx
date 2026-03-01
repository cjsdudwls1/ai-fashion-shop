import { ContactForm } from '@/components/ContactForm';

export default function PartnershipPage() {
    return (
        <div className="section-padding min-h-screen">
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
            </div>
        </div>
    );
}
