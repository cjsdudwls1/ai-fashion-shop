'use client';

import Link from "next/link";
import Image from "next/image";
import { FeaturedProducts } from "@/components/FeaturedProducts";

export default function HomePage() {
  return (
    <main>
      <section className="relative w-full min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* Background Image using next/image for LCP optimization */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="AI Fashion Shop Spring Collection"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            quality={90}
          />
          {/* Enhanced elegant dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 via-black/30 to-black/50"></div>
        </div>

        {/* Hero Content */}
        <div className="container-main relative z-10 flex flex-col items-center justify-center text-center text-white px-4">
          <div className="animate-fade-in flex flex-col items-center">
            <span className="uppercase tracking-[0.3em] text-[11px] md:text-xs font-semibold mb-6 px-4 py-1 border border-white/30 bg-white/10 backdrop-blur-md rounded-full">
              2026 Spring Collection
            </span>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
              DISCOVER <br className="hidden md:block" />
              <span className="italic font-light">YOUR</span> PERFECT FIT
            </h1>
            
            <p className="text-sm md:text-base text-gray-200 max-w-lg mb-12 leading-relaxed font-light tracking-wide drop-shadow">
              AI 가상 리얼 피팅으로 경험하는 새로운 형태의 쇼핑.<br className="hidden md:block" />
              당신의 체형과 스타일에 맞는 완벽한 룩을 찾아보세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link
                href="/products"
                className="group relative overflow-hidden px-10 py-4 bg-white text-black text-[13px] uppercase tracking-[0.2em] font-medium transition-all duration-300 transform hover:bg-gray-100 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
              >
                <span className="relative z-10">Shop Collection</span>
                <div className="absolute inset-0 h-full w-full border border-black/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section - 실제 상품 + 가격 표시 */}
      <FeaturedProducts />
    </main>
  );
}
