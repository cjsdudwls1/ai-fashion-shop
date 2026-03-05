'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
    onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { name: '대시보드', path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: '상품 등록', path: '/admin', icon: 'M12 4v16m8-8H4', exact: true },
        { name: '재고 관리', path: '/admin/inventory', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
        { name: '주문 관리', path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ];

    return (
        <aside className="w-full h-full bg-gray-50 dark:bg-[#0D0D0D] border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="py-8">
                <div className="mb-8 px-8">
                    <h2 className="text-[14px] font-bold text-gray-400 dark:text-gray-300 uppercase tracking-[0.2em]">관리자 메뉴</h2>
                </div>
                <nav className="space-y-2 px-4">
                    {menuItems.map((item) => {
                        const isActive = item.exact ? pathname === item.path : pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => onNavigate?.()}
                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-medium text-[19px] relative overflow-hidden group ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-r-lg"></div>
                                )}
                                <svg className={`w-6 h-6 relative z-10 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={item.icon}></path>
                                </svg>
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
