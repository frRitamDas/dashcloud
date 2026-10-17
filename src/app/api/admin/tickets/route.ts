import { supabaseAdmin } from '@/lib/supabase/admin';
import { ticketPatchSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async () => {
  const { data, error } = await supabaseAdmin().from('tickets').select('*').order('created_at', { ascending: false }).limit(120);
  if (error) return fail(error.message, 500);
  return json({ tickets: data ?? [] });
});

export const PATCH = withAdmin('PATCH', async (req, _params, admin) => {
  const body = ticketPatchSchema.parse(await readJson(req));
  const patch: Record<string, unknown> = {};
  if (body.status) {
    patch.status = body.status;
    patch.resolved_at = body.status === 'resolved' || body.status === 'closed' ? new Date().toISOString() : null;
  }
  if (body.priority) patch.priority = body.priority;
  if (body.category) patch.category = body.category;
  if (body.reply !== undefined) patch.reply = body.reply;

  if (Object.keys(patch).length === 0) return fail('Nothing to update.', 422);

  const { data, error } = await supabaseAdmin().from('tickets').update(patch).eq('id', body.id).select('*').single();
  if (error) return fail(error.message, 500);
  await logActivity({
    actor: admin.username,
    action: 'ticket.updated',
    entity: 'ticket',
    entityId: body.id,
    meta: patch,
  });
  return json({ ticket: data });
});

export const DELETE = withAdmin('DELETE', async (req, _params, admin) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return fail('Missing ticket id.', 400);
  const { error } = await supabaseAdmin().from('tickets').delete().eq('id', id);
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'ticket.deleted', entity: 'ticket', entityId: id });
  return json({ ok: true });
});
