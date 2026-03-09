import type { NextConfig } from "next";

// Node.js 환경에서 발생하는 Supabase 도메인 DNS (IPv6) 해석 실패(ENOTFOUND) 버그 전역 우회
if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
  try {
    const dns = require('node:dns');
    if (dns && dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch (e) {
    // 무시
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 재배포 후 브라우저 캐시 잔존 방지: HTML 페이지에 no-cache 헤더 설정
  // 참고: https://docs.netlify.com/platform/caching/#default-values
  async headers() {
    return [
      {
        // _next/static(JS/CSS 번들)과 _next/image(이미지 최적화)를 제외한 모든 경로
        source: '/((?!_next/static|_next/image).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, no-cache',
          },
        ],
      },
    ];
  },
};


export default nextConfig;
