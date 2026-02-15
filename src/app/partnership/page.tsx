import { ContactForm } from '@/components/ContactForm';

export default function PartnershipPage() {
    return (
        <div className="section-padding min-h-screen">
            <div className="container-main max-w-2xl mx-auto">
                <div className="text-center mb-12 animate-fade-in">
                    <span className="badge badge-primary mb-4">BUSINESS</span>
                    <h1 className="text-hero mb-6">
                        <span className="text-gradient">비지니스 제휴</span> 문의
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                        도매 후 직판을 원하시는 분들은 연락주세요.<br />
                        저희가 도움을 드릴 수 있습니다.
                    </p>
                </div>

                <div className="form-container animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
