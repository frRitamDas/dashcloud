import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { getAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Operator sign-in', robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');
  return <AdminLogin />;
}
