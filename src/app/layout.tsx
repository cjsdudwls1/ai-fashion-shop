import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import GlobalSyncPoller from "@/components/GlobalSyncPoller";

import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 패션샵 | 스마트 의류 쇼핑몰",
  description: "AI 아바타가 직접 소개하는 프리미엄 의류 쇼핑몰. 자동 생성된 제품 소개 영상으로 더 스마트한 쇼핑 경험을 제공합니다.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI 패션샵",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// P3-5: Next.js 15 Viewport API — themeColor 모드별 분기
// 참조: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[var(--bg-dark)] text-[var(--text-primary)]`}>
        <Toaster position="top-center" containerStyle={{ top: 76 }} />
        <Navigation />
        <GlobalSyncPoller />

        {/* 메인 컨텐츠 */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="py-20 px-6 text-[13px] border-t border-[var(--border-color)] bg-[var(--bg-dark)]">
          <div className="container-main">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 mb-16">
              {/* Brand Col */}
              <div className="md:col-span-4 lg:col-span-5">
                <h3 className="text-xl font-bold font-serif tracking-[0.3em] mb-6">AI FASHION</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-loose mb-8 max-w-sm font-light">
                  AI 아바타와 가상 피팅 기술로 새로운 쇼핑 경험을 선사하는 프리미엄 브랜드.
                  당신의 완벽한 핏을 찾아보세요.
                </p>
                <div className="flex gap-6">
                  <a href="#" className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Instagram</a>
                  <a href="#" className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Facebook</a>
                  <a href="#" className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Youtube</a>
                </div>
              </div>

              {/* Shop Col */}
              <div className="md:col-span-2 lg:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] mb-6">Shop</h4>
                <ul className="flex flex-col gap-4 text-[13px] text-[var(--text-secondary)] font-light">
                  <li><a href="/products" className="hover:text-[var(--text-primary)] transition-colors">All Products</a></li>
                  <li><a href="/products?category=outer" className="hover:text-[var(--text-primary)] transition-colors">Outerwear</a></li>
                  <li><a href="/products?category=top" className="hover:text-[var(--text-primary)] transition-colors">Tops</a></li>
                  <li><a href="/products?category=bottom" className="hover:text-[var(--text-primary)] transition-colors">Bottoms</a></li>
                </ul>
              </div>

              {/* Support Col */}
              <div className="md:col-span-3 lg:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] mb-6">Support</h4>
                <ul className="flex flex-col gap-4 text-[13px] text-[var(--text-secondary)] font-light">
                  <li><a href="/order-lookup" className="hover:text-[var(--text-primary)] transition-colors">주문 조회</a></li>
                  <li><a href="/partnership" className="hover:text-[var(--text-primary)] transition-colors">입점 및 제휴 문의</a></li>
                  <li><a href="/refund" className="hover:text-[var(--text-primary)] transition-colors">교환/반품 안내</a></li>
                  <li><a href="/terms" className="hover:text-[var(--text-primary)] transition-colors">이용약관</a></li>
                </ul>
              </div>

              {/* Company Col */}
              <div className="md:col-span-3 lg:col-span-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] mb-6">Company</h4>
                <div className="flex flex-col gap-3 text-[12px] text-[var(--text-secondary)] leading-relaxed font-light">
                  <p><span className="font-medium text-[var(--text-primary)] tracking-wide">모딕 (MODIC)</span></p>
                  <p>대표자: 천영진</p>
                  <p>사업자등록번호: 796-24-02124</p>
                  <p className="max-w-[200px] leading-relaxed">경기도 의정부시 능곡로 13<br/>102동 210호 (신곡동)</p>
                  <p>cjsdudwls1357@gmail.com</p>
                  <a href="/privacy" className="font-medium text-[var(--text-primary)] mt-2 hover:underline tracking-wide">개인정보처리방침</a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-light">
              <p>&copy; {new Date().getFullYear()} AI Fashion Shop. All Rights Reserved.</p>
              <div className="flex gap-6">
                <span>Secure Payment</span>
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
