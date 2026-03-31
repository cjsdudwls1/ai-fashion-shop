import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | AI 패션샵',
  description: 'AI 패션샵 서비스 이용약관입니다.',
}

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, color: 'var(--text-primary)' }}>
        이용약관
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제1조 (목적)</h2>
          <p>
            본 약관은 AI 패션샵(이하 &quot;회사&quot;)이 운영하는 인터넷 쇼핑몰 서비스(이하 &quot;서비스&quot;)의
            이용조건 및 절차에 관한 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제2조 (정의)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>&quot;서비스&quot;란 회사가 운영하는 인터넷 쇼핑몰을 통해 제공하는 일체의 서비스를 의미합니다.</li>
            <li>&quot;회원&quot;이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.</li>
            <li>&quot;비회원&quot;이란 회원에 가입하지 않고 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;상품&quot;이란 서비스를 통해 판매되는 의류 및 패션 관련 제품을 의미합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제3조 (약관의 효력 및 변경)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 내에 7일 이전부터 공지합니다.</li>
            <li>회원이 개정약관에 동의하지 않을 경우 서비스 이용을 중단하고 이용계약을 해지할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제4조 (서비스의 제공)</h2>
          <p>회사는 다음과 같은 서비스를 제공합니다.</p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>의류 및 패션 상품 판매 서비스</li>
            <li>AI 기반 상품 추천 및 아바타 소개 서비스</li>
            <li>주문, 결제, 배송 관련 서비스</li>
            <li>고객 상담 및 A/S 서비스</li>
            <li>기타 회사가 정하는 서비스</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제5조 (회원가입)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
            <li>회사는 전항에 따라 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제6조 (회원탈퇴 및 자격상실)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</li>
            <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>가입 신청 시 허위 내용을 등록한 경우</li>
                <li>서비스를 이용하여 법령 또는 약관에 위반하는 행위를 하는 경우</li>
                <li>다른 사람의 서비스 이용을 방해하거나 정보를 도용하는 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제7조 (구매계약의 성립)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>이용자는 서비스 상에서 다음의 방법에 의하여 구매를 신청합니다.
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>상품의 검색 및 선택</li>
                <li>수령인 정보(성명, 주소, 연락처) 입력</li>
                <li>결제방법 선택 및 결제</li>
              </ul>
            </li>
            <li>회사는 이용자의 구매 신청에 대하여 승낙의 의사표시를 함으로써 구매계약이 성립합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제8조 (결제방법)</h2>
          <p>서비스에서 구매한 상품에 대한 대금 지급 방법은 다음 각 호의 방법 중 가용한 방법으로 할 수 있습니다.</p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>신용카드 결제</li>
            <li>실시간 계좌이체</li>
            <li>무통장입금</li>
            <li>간편결제(카카오페이, 네이버페이, 토스페이 등)</li>
            <li>기타 회사가 정한 결제수단</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제9조 (배송)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회사는 이용자와 상품 등의 공급시기에 관하여 별도의 약정이 없는 이상, 이용자가 결제를 완료한 날부터 7일 이내에 상품 등을 배송할 수 있도록 조치합니다.</li>
            <li>배송 소요 기간은 결제일 기준 2~5 영업일이며, 도서·산간 지역의 경우 추가 소요될 수 있습니다.</li>
            <li>배송비는 상품 페이지에 별도 표기하며, 일정 금액 이상 구매 시 무료배송 혜택이 적용될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제10조 (면책조항)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
            <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제11조 (분쟁해결)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위해 피해보상처리기구를 설치·운영합니다.</li>
            <li>서비스 이용과 관련하여 분쟁이 발생한 경우 전자상거래 분쟁조정위원회 등 관련 기관에 분쟁조정을 신청할 수 있습니다.</li>
          </ol>
        </section>

        <section style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            본 약관은 2026년 3월 30일부터 시행합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
