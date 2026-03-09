import { ADMIN_BANK_INFO } from '@/lib/orderUtils';

interface DepositInfoProps {
    depositorName: string;
    setDepositorName: (name: string) => void;
    error?: string;
    onBlur: () => void;
}

export default function DepositInfo({ depositorName, setDepositorName, error, onBlur }: DepositInfoProps) {
    return (
        <section className="checkout-section">
            <h2 className="checkout-section-title">입금 정보</h2>

            {/* 계좌 안내 — light gray, 아이콘 제거, 계좌번호만 강조 */}
            <div className="deposit-info-box">
                <p className="text-[13px] text-[var(--text-secondary)] mb-2">
                    아래 계좌로 입금해주세요
                </p>
                <p className="account-number">
                    {ADMIN_BANK_INFO.bankName} {ADMIN_BANK_INFO.accountNumber}
                </p>
                <p className="account-holder">
                    예금주: {ADMIN_BANK_INFO.accountHolder}
                </p>
                <p className="trust-msg">
                    주문 완료 후 입금해주시면, 평균 10분 이내 확인됩니다.<br />
                    또는 <strong className="text-[var(--text-primary)] font-bold">{process.env.NEXT_PUBLIC_CONTACT_PHONE || '010-7773-1342'}</strong>로 연락 후 구매하실 수 있습니다.
                </p>
            </div>

            {/* 입금자명 입력 */}
            <div>
                <label className="block text-[14px] font-medium text-[var(--text-secondary)] mb-2">
                    입금자명
                </label>
                <input
                    type="text"
                    required
                    className={`checkout-input ${error ? 'input-error' : ''}`}
                    placeholder="실제 입금 시 사용하는 이름"
                    value={depositorName}
                    onChange={e => setDepositorName(e.target.value)}
                    onBlur={onBlur}
                />
                {error && (
                    <p className="checkout-input-error-msg">{error}</p>
                )}
                <p className="text-[12px] text-[var(--text-muted)] mt-1">
                    입금 시 사용하실 이름과 동일하게 입력해주세요.
                </p>
            </div>
        </section>
    );
}
