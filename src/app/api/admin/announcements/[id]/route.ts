import { supabaseAdmin } from '@/lib/supabase/admin';
import { announcementSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';
type Ctx = { id: string };

export const PATCH = withAdmin<Ctx>('PATCH', async (req, params, admin) => {
  const body = announcementSchema.partial().parse(await readJson(req));
  const { data, error } = await supabaseAdmin().from('announcements').update(body).eq('id', params.id).select('*').single();
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'announcement.updated', entity: 'announcement', entityId: params.id, meta: { changed: Object.keys(body) } });
  return json({ announcement: data });
});

export const DELETE = withAdmin<Ctx>('DELETE', async (_req, params, admin) => {
  const { error } = await supabaseAdmin().from('announcements').delete().eq('id', params.id);
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'announcement.deleted', entity: 'announcement', entityId: params.id });
  return json({ ok: true });
});
