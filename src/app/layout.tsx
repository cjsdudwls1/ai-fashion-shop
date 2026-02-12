import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI 패션샵 | 스마트 의류 쇼핑몰",
  description: "AI 아바타가 직접 소개하는 프리미엄 의류 쇼핑몰. 자동 생성된 제품 소개 영상으로 더 스마트한 쇼핑 경험을 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Navigation />

        {/* 메인 컨텐츠 */}
        <main className="pt-24 min-h-screen">
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
