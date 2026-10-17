import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { userPatchSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = Math.min(100, Number(url.searchParams.get('perPage') ?? 25));

  let query = supabaseAdmin()
    .from('profiles')
    .select('id,username,display_name,avatar_url,country,xp,level,coins,total_play_seconds,games_played,is_pro,is_banned,last_seen_at,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (q) query = query.ilike('username', `%${q}%`);
  const { data, count, error } = await query;
  if (error) return fail(error.message, 500);
  return json({ users: data ?? [], total: count ?? 0, page, perPage });
});

export const PATCH = withAdmin('PATCH', async (req, _params, admin) => {
  const body = userPatchSchema.parse(await readJson(req));
  const { id, ...patch } = body;
  if (Object.keys(patch).length === 0) return fail('Nothing to update', 400);

  const db = supabaseAdmin();
  if (patch.xp !== undefined) patch.xp = patch.xp;
  const update: Record<string, unknown> = { ...patch };
  if (patch.xp !== undefined) update.level = Math.max(1, Math.floor(Math.sqrt(patch.xp / 250)) + 1);

  const { data, error } = await db.from('profiles').update(update).eq('id', id).select('id,username,is_banned,is_pro,coins,xp,level').single();
  if (error) return fail(error.message, 500);

  await logActivity({
    actor: admin.username,
    action: patch.is_banned ? 'user.banned' : patch.is_pro !== undefined ? 'user.plan_changed' : 'user.updated',
    entity: 'profile',
    entityId: id,
    meta: { changed: Object.keys(patch), target: data?.username },
  });
  return json({ user: data });
});

export const DELETE = withAdmin('DELETE', async (req, _params, admin) => {
  const body = z.object({ id: z.string().uuid() }).parse(await readJson(req));
  const { error } = await supabaseAdmin().from('profiles').delete().eq('id', body.id);
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'user.deleted', entity: 'profile', entityId: body.id });
  return json({ ok: true });
});
