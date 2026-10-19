import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  region: z.string().trim().max(40).optional(),
  resolution: z.string().trim().max(20).optional(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  guestId: z.string().trim().min(6).max(80).optional(),
});

const endSchema = z.object({
  sessionId: z.string().uuid(),
  guestId: z.string().trim().min(6).max(80).optional(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 8),
  status: z.enum(['ended', 'failed']).default('ended'),
});

const streamingSchema = z.object({
  sessionId: z.string().uuid(),
  guestId: z.string().trim().min(6).max(80).optional(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  resolution: z.string().trim().max(20).optional(),
  region: z.string().trim().max(40).optional(),
});

const rawSchema = z.record(z.unknown());
const startLimit = withPublicRateLimit('session-start', 25, 60_000);
const endLimit = withPublicRateLimit('session-end', 40, 60_000);
const streamingLimit = withPublicRateLimit('session-streaming', 60, 60_000);

export async function POST(req: Request) {
  const rawResult = rawSchema.safeParse(await readJson(req));
  if (!rawResult.success) return fail('Invalid session request', 400);
  const raw = rawResult.data;

  if (raw.sessionId && (raw.end === true || raw.durationSeconds !== undefined)) {
    const parsed = endSchema.safeParse(raw);
    if (!parsed.success) return fail('Invalid session end payload', 422);
    return endSession(req, parsed.data);
  }

  if (raw.sessionId && raw.streaming === true) {
    const parsed = streamingSchema.safeParse(raw);
    if (!parsed.success) return fail('Invalid session update payload', 422);
    return markStreaming(req, parsed.data);
  }

  const rate = startLimit(req);
  if (!rate.ok) return fail('Too many sessions started. Please slow down.', 429, { retryAfter: rate.retryAfter });

  const parsed = startSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('Invalid session start payload', 422, {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  const body = parsed.data;
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user && !body.guestId) return fail('A guest session identifier is required.', 400);

  const { data: game, error: gameError } = await db
    .from('games')
    .select('id,status,play_mode')
    .eq('slug', body.slug)
    .eq('published', true)
    .maybeSingle();

  if (gameError) {
    console.error('[sessions:game-lookup]', gameError.code, gameError.message);
    return fail('Could not start a session right now.', 503);
  }
  if (!game) return fail('Game not found', 404);
  if (game.status === 'maintenance' || game.status === 'soon') {
    return fail('This title is not currently available to launch.', 503);
  }

  const target = user ? db : supabaseAdmin();
  const { data, error } = await target
    .from('game_sessions')
    .insert({
      user_id: user?.id ?? null,
      guest_id: user ? null : body.guestId,
      game_id: game.id,
      region: body.region ?? 'auto',
      resolution: body.resolution ?? '1080p60',
      latency_ms: body.latencyMs ?? null,
      status: 'booting',
    })
    .select('id,started_at')
    .single();

  if (error || !data) {
    console.error('[sessions:start]', error?.code, error?.message);
    return fail('Could not start a session right now.', 503);
  }

  if (user) {
    await db.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
  }

  return json({ session: data, playMode: game.play_mode, status: game.status }, { status: 201 });
}

async function markStreaming(req: Request, body: z.infer<typeof streamingSchema>) {
  const rate = streamingLimit(req);
  if (!rate.ok) return fail('Too many session updates', 429, { retryAfter: rate.retryAfter });

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user && !body.guestId) return fail('Guest session identifier is required.', 403);

  const target = user ? db : supabaseAdmin();
  const { data: existing, error: readError } = await target
    .from('game_sessions')
    .select('id,user_id,guest_id,status')
    .eq('id', body.sessionId)
    .maybeSingle();

  if (readError || !existing) return fail('Session not found', 404);
  if (user ? existing.user_id !== user.id : existing.user_id !== null || existing.guest_id !== body.guestId) {
    return fail('You cannot update this session.', 403);
  }
  if (existing.status === 'ended' || existing.status === 'failed') return fail('This session has already ended.', 409);

  const { error } = await target
    .from('game_sessions')
    .update({
      status: 'streaming',
      latency_ms: body.latencyMs ?? null,
      resolution: body.resolution ?? '1080p60',
      region: body.region ?? 'auto',
    })
    .eq('id', body.sessionId);

  if (error) {
    console.error('[sessions:streaming]', error.code, error.message);
    return fail('Could not update the session.', 503);
  }
  return json({ ok: true });
}

export async function PATCH(req: Request) {
  const parsed = endSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('Invalid session end payload', 422);
  return endSession(req, parsed.data);
}

async function endSession(req: Request, body: z.infer<typeof endSchema>) {
  const rate = endLimit(req);
  if (!rate.ok) return fail('Too many session updates', 429, { retryAfter: rate.retryAfter });

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user && !body.guestId) return fail('Guest session identifier is required.', 403);

  const target = user ? db : supabaseAdmin();
  const { data: existing, error: readError } = await target
    .from('game_sessions')
    .select('id,user_id,guest_id,game_id,duration_seconds,status')
    .eq('id', body.sessionId)
    .maybeSingle();

  if (readError || !existing) return fail('Session not found', 404);
  if (user ? existing.user_id !== user.id : existing.user_id !== null || existing.guest_id !== body.guestId) {
    return fail('You cannot end this session.', 403);
  }
  if (existing.status === 'ended' || existing.status === 'failed') return json({ ok: true, alreadyEnded: true });

  const total = (existing.duration_seconds ?? 0) + body.durationSeconds;
  const { error } = await target
    .from('game_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds: total, status: body.status })
    .eq('id', body.sessionId);

  if (error) {
    console.error('[sessions:end]', error.code, error.message);
    return fail('Could not finish this session.', 503);
  }

  if (user && existing.user_id === user.id && body.durationSeconds >= 30) {
    const xpGain = Math.min(240, Math.round(body.durationSeconds / 6));
    const coinGain = Math.min(60, Math.round(body.durationSeconds / 30));
    const { data: profile } = await db.from('profiles').select('xp,coins,total_play_seconds,games_played').eq('id', user.id).maybeSingle();

    if (profile) {
      const xp = (profile.xp ?? 0) + xpGain;
      const { error: profileError } = await db
        .from('profiles')
        .update({
          xp,
          coins: (profile.coins ?? 0) + coinGain,
          level: Math.max(1, Math.floor(Math.sqrt(xp / 250)) + 1),
          total_play_seconds: (profile.total_play_seconds ?? 0) + body.durationSeconds,
          games_played: (profile.games_played ?? 0) + 1,
        })
        .eq('id', user.id);
      if (profileError) console.error('[sessions:progression]', profileError.code, profileError.message);
    }

    return json({ ok: true, xpGain, coinGain });
  }

  return json({ ok: true });
}
