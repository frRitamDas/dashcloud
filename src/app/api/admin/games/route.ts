import { supabaseAdmin } from '@/lib/supabase/admin';
import { gameUpsertSchema } from '@/lib/admin-schemas';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  let query = supabaseAdmin().from('games').select('*').order('sort_order', { ascending: true });
  if (q) query = query.ilike('title', `%${q}%`);
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return json({ games: data ?? [] });
});

export const POST = withAdmin('POST', async (req, _params, admin) => {
  const body = gameUpsertSchema.parse(await readJson(req));
  const payload = {
    ...body,
    cover_url: body.cover_url || null,
    banner_url: body.banner_url || null,
    stream_url: body.stream_url || null,
    engine_key: body.play_mode === 'native' ? body.engine_key : null,
    requirements: body.requirements ?? {},
    tags: body.tags ?? [],
    screenshots: body.screenshots ?? [],
  };
  const { data, error } = await supabaseAdmin().from('games').insert(payload).select('*').single();
  if (error) return fail(error.code === '23505' ? `Slug "${body.slug}" already exists.` : error.message, error.code === '23505' ? 409 : 500);
  await logActivity({ actor: admin.username, action: 'game.created', entity: 'game', entityId: data.id, meta: { slug: data.slug, title: data.title } });
  return json({ game: data });
});
