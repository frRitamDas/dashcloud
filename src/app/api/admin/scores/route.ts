import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async (req) => {
  const url = new URL(req.url);
  const gameId = url.searchParams.get('gameId');
  const take = Math.min(200, Number(url.searchParams.get('limit') ?? 50));

  let query = supabaseAdmin()
    .from('scores')
    .select('id,score,metric,payload,created_at,user_id,guest_name,games(title,slug,accent),profiles(username,display_name,level)')
    .order('score', { ascending: false })
    .limit(take);
  if (gameId) query = query.eq('game_id', gameId);

  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return json({ scores: data ?? [] });
});

export const DELETE = withAdmin('DELETE', async (req, _params, admin) => {
  const body = z.object({ id: z.string().uuid() }).parse(await readJson(req));
  const { error } = await supabaseAdmin().from('scores').delete().eq('id', body.id);
  if (error) return fail(error.message, 500);
  await logActivity({ actor: admin.username, action: 'score.deleted', entity: 'score', entityId: body.id });
  return json({ ok: true });
});
