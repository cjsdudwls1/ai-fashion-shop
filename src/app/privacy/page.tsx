import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 | AI 패션샵',
  description: 'AI 패션샵의 개인정보처리방침입니다.',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, color: 'var(--text-primary)' }}>
        개인정보처리방침
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>

        <section>
          <p>
            AI 패션샵(이하 &quot;회사&quot;)은 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고
            이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제1조 (수집하는 개인정보 항목)</h2>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>1. 필수 수집 항목</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>회원가입 시: 이메일 주소, 이름(닉네임), 비밀번호</li>
              <li>상품 구매 시: 수령인 성명, 배송지 주소, 연락처</li>
              <li>결제 시: 결제 수단 정보(카드번호 등은 PG사에서 관리)</li>
            </ul>
          </div>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>2. 자동 수집 항목</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보</li>
            </ul>
          </div>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>3. 소셜 로그인 시</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Google: 이메일, 이름, 프로필 사진</li>
              <li>Kakao: 이메일, 닉네임, 프로필 이미지</li>
              <li>Naver: 이메일, 이름, 프로필 이미지</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제2조 (개인정보의 수집 및 이용 목적)</h2>
          <p>회사는 다음의 목적을 위해 개인정보를 처리합니다.</p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>회원 관리</strong>: 회원 식별, 가입 의사 확인, 본인 확인, 불량 회원 부정이용 방지</li>
            <li><strong>상품 주문 및 배송</strong>: 주문 상품 배송, 배송지 확인, 교환/반품 처리</li>
            <li><strong>결제 처리</strong>: 상품 대금 결제, 환불 처리</li>
            <li><strong>고객 상담</strong>: 불만 처리, 공지사항 전달, 분쟁 조정을 위한 기록 보존</li>
            <li><strong>서비스 개선</strong>: AI 기반 상품 추천, 맞춤형 서비스 제공, 통계 분석</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제3조 (개인정보의 보유 및 이용 기간)</h2>
          <p>회사는 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.</p>
          <div style={{ marginTop: 12, padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
            <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>계약 또는 청약철회 등에 관한 기록</strong>: 5년 (전자상거래법)</li>
              <li><strong>대금결제 및 재화 등의 공급에 관한 기록</strong>: 5년 (전자상거래법)</li>
              <li><strong>소비자 불만 또는 분쟁 처리에 관한 기록</strong>: 3년 (전자상거래법)</li>
              <li><strong>로그인 기록</strong>: 3개월 (통신비밀보호법)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제4조 (개인정보의 제3자 제공)</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제5조 (개인정보 처리의 위탁)</h2>
          <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-primary)' }}>위탁 업체</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-primary)' }}>위탁 업무</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>포트원(PortOne)</td>
                  <td style={{ padding: '10px 12px' }}>전자결제 처리</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>토스페이먼츠</td>
                  <td style={{ padding: '10px 12px' }}>신용카드, 계좌이체 등 결제 대행</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px' }}>택배사(CJ대한통운 등)</td>
                  <td style={{ padding: '10px 12px' }}>상품 배송</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제6조 (이용자의 권리)</h2>
          <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.</p>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>개인정보 열람, 정정, 삭제, 처리정지 요청</li>
            <li>위 요청은 서비스 내 설정 페이지 또는 고객센터를 통해 가능합니다.</li>
            <li>회사는 본인 확인 절차를 거친 후 지체 없이 조치하겠습니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제7조 (개인정보의 파기)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
            <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
            <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제8조 (개인정보 보호책임자)</h2>
          <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
            <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>개인정보 보호책임자: 대표자</li>
              <li>연락처: cjsdudwls1357@gmail.com</li>
            </ul>
          </div>
          <p style={{ marginTop: 12 }}>
            이용자는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
            개인정보 보호책임자에게 문의할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 &apos;쿠키(Cookie)&apos;를 사용합니다.</li>
            <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저 옵션 설정을 통해 모든 쿠키를 허용하거나 쿠키가 저장될 때마다 확인을 거치거나 모든 쿠키의 저장을 거부할 수 있습니다.</li>
            <li>쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
          </ol>
        </section>

        <section style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            본 개인정보처리방침은 2026년 3월 30일부터 적용됩니다.
          </p>
        </section>
      </div>
    </div>
  )
}
