'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Plus, Inbox, ClipboardList, type LucideIcon } from 'lucide-react';

interface AdminSidebarProps {
    onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();

    const menuItems: { name: string; path: string; icon: LucideIcon; exact?: boolean }[] = [
        { name: '대시보드', path: '/admin/dashboard', icon: LayoutGrid },
        { name: '상품 등록', path: '/admin', icon: Plus, exact: true },
        { name: '재고 관리', path: '/admin/inventory', icon: Inbox },
        { name: '주문 관리', path: '/admin/orders', icon: ClipboardList },
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
                                <item.icon className={`w-6 h-6 relative z-10 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white'}`} strokeWidth={2.5} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
