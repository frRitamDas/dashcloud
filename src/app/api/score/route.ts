import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  slug: z.string().min(1).max(80),
  score: z.number().int().min(0).max(100_000_000),
  metric: z.string().min(1).max(30).default('points'),
  payload: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  guestName: z.string().min(2).max(24).optional(),
});

const limit = withPublicRateLimit('score-submit', 40, 60_000);

export async function POST(req: Request) {
  const l = limit(req);
  if (!l.ok) return fail('Too many score submissions', 429, { retryAfter: l.retryAfter });

  const body = schema.parse(await readJson(req));
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user && !body.guestName) return fail('Sign in or enter a player name to save scores.', 401);

  const { data: game } = await sb.from('games').select('id,slug').eq('slug', body.slug).maybeSingle();
  if (!game) return fail('Game not found', 404);

  const target = user ? sb : supabaseAdmin();
  const { data, error } = await target
    .from('scores')
    .insert({
      user_id: user?.id ?? null,
      guest_name: user ? null : (body.guestName ?? 'Guest'),
      game_id: game.id,
      score: body.score,
      metric: body.metric,
      payload: body.payload ?? {},
    })
    .select('id,score,created_at')
    .single();

  if (error) return fail(error.message, 500);

  let rank: number | null = null;
  const { count } = await target
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
    .gt('score', body.score);
  rank = (count ?? 0) + 1;

  if (user) {
    const xpGain = Math.min(120, 20 + Math.round(body.score / 400));
    const { data: profile } = await sb.from('profiles').select('xp,coins').eq('id', user.id).maybeSingle();
    if (profile) {
      const xp = (profile.xp ?? 0) + xpGain;
      await sb
        .from('profiles')
        .update({ xp, coins: (profile.coins ?? 0) + Math.min(25, Math.round(xpGain / 4)), level: Math.max(1, Math.floor(Math.sqrt(xp / 250)) + 1) })
        .eq('id', user.id);
    }
  }

  return json({ ok: true, score: data, rank });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const take = Math.min(50, Number(url.searchParams.get('limit') ?? 20));
  if (!slug) return fail('slug is required', 400);

  const sb = await supabaseServer();
  const { data: game } = await sb.from('games').select('id').eq('slug', slug).maybeSingle();
  if (!game) return fail('Game not found', 404);

  const { data } = await sb
    .from('scores')
    .select('id,score,metric,created_at,guest_name,profiles(username,display_name,avatar_url,level)')
    .eq('game_id', game.id)
    .order('score', { ascending: false })
    .limit(take);

  return json({ scores: data ?? [] });
}
