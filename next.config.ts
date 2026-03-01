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
};


export default nextConfig;
