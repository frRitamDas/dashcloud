import { supabaseAdmin } from '@/lib/supabase/admin';
import { settingsSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async () => {
  const { data, error } = await supabaseAdmin().from('settings').select('*');
  if (error) return fail(error.message, 500);
  return json({ settings: data ?? [] });
});

export const PATCH = withAdmin('PATCH', async (req, _params, admin) => {
  const body = settingsSchema.parse(await readJson(req));
  const { error } = await supabaseAdmin()
    .from('settings')
    .upsert({ key: body.key, value: body.value, is_public: body.is_public ?? true, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'settings.updated', entity: 'settings', entityId: body.key, meta: { keys: Object.keys(body.value) } });
  return json({ ok: true });
});
