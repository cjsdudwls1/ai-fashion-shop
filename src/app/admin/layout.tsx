import { redirect } from 'next/navigation';
import { getCurrentUser, isAdminUser } from '@/lib/authUtils';
import AdminLayoutClient from './AdminLayoutClient';

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
        <div className="flex bg-[var(--bg-main)] min-h-screen">
            <AdminLayoutClient>
                {children}
            </AdminLayoutClient>
        </div>
    );
}

