import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import GlobalSyncPoller from "@/components/GlobalSyncPoller";

import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} antialiased`}>
        <Toaster position="top-center" containerStyle={{ top: 76 }} />
        <Navigation />
        <GlobalSyncPoller />

        {/* 메인 컨텐츠 */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="py-8 px-6 text-sm border-t">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* 사업자 정보 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>모딕 (MODIC)</p>
              <p>대표자: 천영진 | 사업자등록번호: 796-24-02124 | 연락처: 010-7433-2073</p>
              <p>주소: 경기도 의정부시 능곡로 13, 102동 210호 (신곡동, 추동아파트)</p>
              <p>이메일: help@ai-fashion-shop.com | 업태: 도매 및 소매업 / 전자상거래소매업</p>
            </div>

            {/* 법적 고지 링크 */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16, fontSize: 13 }}>
              <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>이용약관</a>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>개인정보처리방침</a>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <a href="/refund" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>교환/반품/환불 정책</a>
            </div>

            {/* 카피라이트 */}
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              &copy; {new Date().getFullYear()} AI Fashion Shop. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
