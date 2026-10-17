import { supabaseAdmin } from '@/lib/supabase/admin';
import { gameUpsertSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Ctx = { id: string };

export const PATCH = withAdmin<Ctx>('PATCH', async (req, params, admin) => {
  const parsed = gameUpsertSchema.partial().parse(await readJson(req));
  if (Object.keys(parsed).length === 0) return fail('Nothing to update', 400);

  const db = supabaseAdmin();
  const { data: existing } = await db.from('games').select('id,slug,title,status').eq('id', params.id).maybeSingle();
  if (!existing) return fail('Game not found', 404);

  const payload: Record<string, unknown> = { ...parsed };
  if (parsed.cover_url === '') payload.cover_url = null;
  if (parsed.banner_url === '') payload.banner_url = null;
  if (parsed.stream_url === '') payload.stream_url = null;
  if (parsed.play_mode === 'cloud') payload.engine_key = null;

  const { data, error } = await db.from('games').update(payload).eq('id', params.id).select('*').single();
  if (error) return fail(error.code === '23505' ? 'That slug is already taken.' : error.message, error.code === '23505' ? 409 : 500);

  await logActivity({
    actor: admin.username,
    action: 'game.updated',
    entity: 'game',
    entityId: params.id,
    meta: { slug: existing.slug, changed: Object.keys(parsed), status: data?.status },
  });
  return json({ game: data });
});

export const DELETE = withAdmin<Ctx>('DELETE', async (_req, params, admin) => {
  const db = supabaseAdmin();
  const { data: existing } = await db.from('games').select('id,slug,title').eq('id', params.id).maybeSingle();
  if (!existing) return fail('Game not found', 404);
  const { error } = await db.from('games').delete().eq('id', params.id);
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'game.deleted', entity: 'game', entityId: params.id, meta: { slug: existing.slug, title: existing.title } });
  return json({ ok: true });
});
