import { forbidden, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminOverview } from '@/lib/admin-overview';
import { isAdmin } from '@/lib/rbac';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (!isAdmin(session.user.role)) forbidden();

  const overview = await getAdminOverview();
  return (
    <AdminDashboard
      adminName={session.user.name || 'Administrator'}
      counts={overview.counts}
      users={overview.users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))}
      loginLogs={overview.loginLogs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))}
    />
  );
}
