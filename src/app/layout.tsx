import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

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
        <Toaster position="top-center" />
        <Navigation />

        {/* 메인 컨텐츠 */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="py-8 px-6 text-center text-sm border-t">
          <p>MVP Demo - AI 아바타 영상 자동 생성 쇼핑몰</p>
        </footer>
      </body>
    </html>
  );
}
