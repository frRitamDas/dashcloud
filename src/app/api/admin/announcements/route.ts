import { supabaseAdmin } from '@/lib/supabase/admin';
import { announcementSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async () => {
  const { data, error } = await supabaseAdmin().from('announcements').select('*').order('created_at', { ascending: false });
  if (error) return fail(error.message, 500);
  return json({ announcements: data ?? [] });
});

export const POST = withAdmin('POST', async (req, _params, admin) => {
  const body = announcementSchema.parse(await readJson(req));
  const { data, error } = await supabaseAdmin().from('announcements').insert(body).select('*').single();
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'announcement.created', entity: 'announcement', entityId: data.id, meta: { title: data.title } });
  return json({ announcement: data });
});
