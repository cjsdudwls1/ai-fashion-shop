'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: '0px', background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop") center center / cover no-repeat', zIndex: -1 }}></div>
        <div className="container-main relative" style={{ textAlign: 'center', color: 'white' }}>
          <div className="animate-fade-in">
            <span style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500, marginBottom: '24px', letterSpacing: '0.05em' }}>2026 SPRING COLLECTION</span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px', letterSpacing: '-0.02em', textShadow: 'rgba(0, 0, 0, 0.3) 0px 4px 12px' }}>DISCOVER YOUR<br />PERFECT FIT</h1>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', margin: '0px auto 40px', maxWidth: '600px', lineHeight: 1.6 }}>AI 가상 리얼 피팅으로 경험하는 새로운 형태의 쇼핑.<br />당신의 체형과 스타일에 맞는 완벽한 룩을 찾아보세요.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
              <Link className="hover:scale-105" href="/products" style={{ background: 'white', color: 'black', padding: '14px 28px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, transition: 'transform 0.2s' }}>쇼핑하기</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
