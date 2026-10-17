import { supabaseAdmin } from '@/lib/supabase/admin';
import { statusPatchSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async () => {
  const { data, error } = await supabaseAdmin().from('service_status').select('*').order('sort_order', { ascending: true });
  if (error) return fail(error.message, 500);
  return json({ status: data ?? [] });
});

export const PATCH = withAdmin('PATCH', async (req, _params, admin) => {
  const body = statusPatchSchema.parse(await readJson(req));
  const { id, ...patch } = body;
  if (Object.keys(patch).length === 0) return fail('Nothing to update', 400);

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('service_status')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return fail(error.message, 500);

  await logActivity({
    actor: admin.username,
    action: 'status.updated',
    entity: 'service_status',
    entityId: id,
    meta: { region: data.region, service: data.service, patch },
  });
  return json({ status: data });
});
