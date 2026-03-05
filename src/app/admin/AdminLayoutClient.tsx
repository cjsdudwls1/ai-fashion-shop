'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 모바일에서 사이드바가 열릴 때 body 스크롤 방지
    useEffect(() => {
        if (isMobile && sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, sidebarOpen]);

    return (
        <div className="admin-layout-root" style={{ fontSize: '18px' }}>
            {/* 모바일 햄버거 버튼 */}
            {isMobile && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="admin-mobile-menu-btn"
                    aria-label="메뉴 열기"
                    style={{
                        position: 'fixed',
                        top: '72px',
                        left: '12px',
                        zIndex: 50,
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            )}

            {/* 모바일 오버레이 */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 55,
                        transition: 'opacity 0.3s',
                    }}
                />
            )}

            {/* 사이드바 */}
            <div
                className="admin-sidebar-wrapper"
                style={{
                    position: 'fixed',
                    top: isMobile ? '0' : '64px',
                    left: 0,
                    width: '280px',
                    height: isMobile ? '100vh' : 'calc(100vh - 64px)',
                    zIndex: 60,
                    transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <AdminSidebar onNavigate={() => { if (isMobile) setSidebarOpen(false); }} />
            </div>

            {/* 콘텐츠 영역 */}
            <div
                className="admin-content-area"
                style={{
                    flex: 1,
                    overflowX: 'hidden',
                    paddingTop: '16px',
                    marginLeft: isMobile ? '0' : '280px',
                    marginTop: '-64px',
                }}
            >
                <div
                    style={{
                        marginTop: '64px',
                        minHeight: 'calc(100vh - 64px)',
                        overflowY: 'auto',
                        width: '100%',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
