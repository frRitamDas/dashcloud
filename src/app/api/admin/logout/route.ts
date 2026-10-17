import { clearAdminCookie, getAdminSession } from '@/lib/admin-session';
import { json, logActivity } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getAdminSession();
  await clearAdminCookie();
  if (session) await logActivity({ actor: session.username, action: 'admin.logout', entity: 'admin', entityId: session.sub });
  return json({ ok: true });
}
