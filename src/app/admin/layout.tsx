import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminUser } from '@/lib/authUtils';
import AdminVideoSyncer from './AdminVideoSyncer';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 이중 방어: 미들웨어(1차) + 레이아웃(2차)
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?next=/admin');
    }

    if (!(await isAdminUser(user))) {
        redirect('/');
    }

    return (
        <div className="flex bg-[var(--bg-main)] min-h-screen" style={{ fontSize: '18px' }}>
            <AdminSidebar />
            <div className="flex-1 overflow-x-hidden pt-16" style={{ marginLeft: '280px', marginTop: '-64px' }}>
                <div className="mt-[64px] min-h-[calc(100vh-64px)] overflow-y-auto w-full">
                    <AdminVideoSyncer />
                    {children}
                </div>
            </div>
        </div>
    );
}
