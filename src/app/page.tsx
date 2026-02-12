import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="section-padding relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.2), transparent, rgba(22, 78, 99, 0.2))'
        }} />
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(6, 182, 212, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />

        <div className="container-main relative" style={{ textAlign: 'center' }}>
          <div className="animate-fade-in">
            <span className="badge badge-primary" style={{ marginBottom: '24px' }}>AI 기반 쇼핑몰 MVP</span>
            <h1 className="text-hero" style={{ marginBottom: '24px' }}>
              <span className="text-gradient">AI 아바타</span>가<br />
              제품을 소개합니다
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              marginBottom: '40px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              관리자가 제품을 업로드하면 AI가 자동으로 제품 소개 영상을 생성합니다.
              고객은 쇼핑 카드와 함께 영상을 바로 시청할 수 있습니다.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              <Link href="/products" className="btn-primary" style={{ fontSize: '1.125rem', padding: '16px 32px' }}>
                제품 둘러보기
              </Link>
              <Link href="/admin" className="glass-card" style={{
                padding: '16px 32px',
                fontSize: '1.125rem',
                fontWeight: '600',
                textDecoration: 'none',
                color: 'var(--text-primary)'
              }}>
                관리자 페이지
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="section-padding">
        <div className="container-main">
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', textAlign: 'center', marginBottom: '48px' }}>
            <span className="text-gradient">자동화된</span> 쇼핑몰 관리
          </h2>

          <div className="grid-cards">
            {/* 기능 1 */}
            <div className="glass-card animate-slide-up" style={{ padding: '32px', animationDelay: '0.1s' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>간편한 상품 등록</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                이미지, 질감, 재고 정보를 한 번에 입력하세요.
                복잡한 설정 없이 바로 등록됩니다.
              </p>
            </div>

            {/* 기능 2 */}
            <div className="glass-card animate-slide-up" style={{ padding: '32px', animationDelay: '0.2s' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(to bottom right, #06b6d4, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>AI 영상 자동 생성</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                상품 등록 즉시 AI 아바타가 제품 소개 영상을 자동으로 생성합니다.
                별도 버튼 클릭이 필요 없습니다.
              </p>
            </div>

            {/* 기능 3 */}
            <div className="glass-card animate-slide-up" style={{ padding: '32px', animationDelay: '0.3s' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(to bottom right, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>즉시 반영</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                등록된 상품은 제품 페이지에 즉시 반영됩니다.
                고객은 새로고침만 하면 최신 상품을 볼 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 워크플로우 */}
      <section className="section-padding" style={{ background: 'linear-gradient(to bottom, transparent, rgba(88, 28, 135, 0.1))' }}>
        <div className="container-main" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '48px' }}>동작 원리</h2>

          <div className="workflow-steps">
            <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-primary">1</span>
              <span>관리자가 제품 등록</span>
            </div>

            <svg style={{ width: '24px', height: '24px', color: '#8b5cf6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-info">2</span>
              <span>AI가 영상 자동 생성</span>
            </div>

            <svg style={{ width: '24px', height: '24px', color: '#8b5cf6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-success">3</span>
              <span>고객이 바로 확인</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
