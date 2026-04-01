import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '환불 정책 | AI 패션샵',
  description: 'AI 패션샵의 교환, 반품, 환불 정책 안내입니다.',
}

export default function RefundPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, color: 'var(--text-primary)' }}>
        환불 정책
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>

        <section style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            AI 패션샵은 전자상거래 등에서의 소비자보호에 관한 법률(이하 &quot;전자상거래법&quot;)에 따라
            소비자의 교환 및 환불 권리를 보장합니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제1조 (청약철회 및 반품)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>구매자는 상품을 수령한 날로부터 <strong>7일 이내</strong>에 청약철회(반품)를 요청할 수 있습니다.</li>
            <li>상품이 표시·광고 내용과 다르거나 계약 내용과 다르게 이행된 경우에는 상품을 수령한 날로부터 <strong>3개월 이내</strong>, 그 사실을 안 날 또는 알 수 있었던 날로부터 <strong>30일 이내</strong>에 청약철회가 가능합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제2조 (교환 및 반품이 불가능한 경우)</h2>
          <p>다음에 해당하는 경우에는 교환 및 반품이 제한됩니다.</p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>구매자에게 책임 있는 사유로 상품이 멸실되거나 훼손된 경우 (단, 상품의 내용을 확인하기 위해 포장을 훼손한 경우는 제외)</li>
            <li>구매자의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히 감소한 경우</li>
            <li>시간의 경과에 의하여 재판매가 곤란할 정도로 상품 등의 가치가 현저히 감소한 경우</li>
            <li>같은 성능을 지닌 상품으로 복제가 가능한 경우 그 원본의 포장을 훼손한 경우</li>
            <li>주문 제작 상품의 경우 (단, 하자가 있는 경우 제외)</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제3조 (반품 및 교환 절차)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>1</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>반품/교환 신청</p>
                <p>마이페이지 주문 내역에서 반품/교환을 신청하거나 고객센터로 연락합니다.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>2</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>상품 반송</p>
                <p>승인 후 안내된 방법으로 상품을 반송합니다. 상품 태그와 포장을 유지해 주세요.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>3</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>검수 및 처리</p>
                <p>반송 상품 도착 후 1~3 영업일 내 검수를 진행합니다.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>4</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>환불 완료</p>
                <p>검수 완료 후 원래 결제 수단으로 환불이 진행됩니다.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제4조 (환불 방법 및 소요 기간)</h2>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-primary)' }}>결제 수단</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-primary)' }}>환불 방법</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-primary)' }}>소요 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>신용카드</td>
                  <td style={{ padding: '10px 12px' }}>결제 취소</td>
                  <td style={{ padding: '10px 12px' }}>3~7 영업일</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>계좌이체</td>
                  <td style={{ padding: '10px 12px' }}>계좌 환불</td>
                  <td style={{ padding: '10px 12px' }}>3~5 영업일</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>무통장입금</td>
                  <td style={{ padding: '10px 12px' }}>계좌 환불</td>
                  <td style={{ padding: '10px 12px' }}>3~5 영업일</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>간편결제</td>
                  <td style={{ padding: '10px 12px' }}>결제 취소</td>
                  <td style={{ padding: '10px 12px' }}>즉시~3 영업일</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제5조 (반품 배송비)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>판매자 귀책 사유</strong> (오배송, 불량 등): 반품 배송비를 회사가 부담합니다.</li>
            <li><strong>구매자 단순 변심</strong>: 반품 배송비(편도 3,000원)를 구매자가 부담합니다.</li>
            <li>교환 시 왕복 배송비(6,000원)가 발생할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제6조 (미성년자 거래 취소)</h2>
          <p>
            미성년자가 법정대리인의 동의 없이 구매한 경우, 미성년자 또는 법정대리인은 해당 거래를 취소할 수 있습니다.
            단, 미성년자가 법정대리인이 허락한 처분 가능한 재산으로 구매하였거나, 속임수로 능력자로 믿게 한 경우에는
            취소가 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제7조 (고객 문의)</h2>
          <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
            <p>교환, 반품, 환불 관련 문의는 아래 채널을 통해 접수하실 수 있습니다.</p>
            <ul style={{ paddingLeft: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>이메일: cjsdudwls1357@gmail.com</li>
              <li>운영시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무)</li>
            </ul>
          </div>
        </section>

        <section style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            본 환불 정책은 2026년 3월 30일부터 적용됩니다.
          </p>
        </section>
      </div>
    </div>
  )
}
