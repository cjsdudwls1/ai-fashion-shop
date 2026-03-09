'use client';

import { Zap } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">대시보드</h1>
                    <p className="text-lg md:text-xl text-[var(--text-secondary)] mt-2 font-medium">전체 서비스 요약 및 현황을 확인하세요.</p>
                </div>
            </div>

            <div className="bg-[var(--bg-elevated)] p-10 rounded-2xl border border-[var(--border-color)] text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">대시보드 준비중</h3>
                <p className="text-xl text-[var(--text-secondary)] mb-6">다양한 통계 지표와 요약 정보를 제공할 예정입니다.</p>
            </div>
        </div>
    );
}
