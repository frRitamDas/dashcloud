import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/admin-session';
import { getAdminOverview } from '@/lib/admin-overview';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const initial = await getAdminOverview();

  return <AdminShell admin={{ username: session.username, role: session.role }} initial={initial} />;
}
