import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  slug: z.string().min(1).max(80),
  region: z.string().max(40).optional(),
  resolution: z.string().max(20).optional(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  guestId: z.string().min(6).max(80).optional(),
});

const endSchema = z.object({
  sessionId: z.string().uuid(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 8),
  status: z.enum(['ended', 'failed']).default('ended'),
});

const streamingSchema = z.object({
  sessionId: z.string().uuid(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  resolution: z.string().max(20).optional(),
  region: z.string().max(40).optional(),
});

const rawSchema = z.record(z.unknown());

const startLimit = withPublicRateLimit('session-start', 25, 60_000);
const endLimit = withPublicRateLimit('session-end', 40, 60_000);

/**
 * POST handles the whole lifecycle so `navigator.sendBeacon` can flush session
 * time when a tab is closed:
 *   { slug, ... }                        -> start
 *   { streaming: true, sessionId }       -> mark as actively streaming
 *   { end: true, sessionId, duration }   -> finish
 */
export async function POST(req: Request) {
  const raw = rawSchema.parse(await readJson(req));

  if (raw.sessionId && (raw.end === true || raw.durationSeconds !== undefined)) {
    return endSession(req, endSchema.parse(raw));
  }
  if (raw.sessionId && raw.streaming === true) {
    return markStreaming(req, streamingSchema.parse(raw));
  }

  const l = startLimit(req);
  if (!l.ok) return fail('Too many sessions started — slow down.', 429, { retryAfter: l.retryAfter });

  const body = startSchema.parse(raw);
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: game } = await sb.from('games').select('id,status,play_mode').eq('slug', body.slug).maybeSingle();
  if (!game) return fail('Game not found', 404);
  if (game.status === 'maintenance') return fail('This title is under maintenance.', 503);

  const row = {
    user_id: user?.id ?? null,
    guest_id: user ? null : (body.guestId ?? null),
    game_id: game.id,
    region: body.region ?? 'auto',
    resolution: body.resolution ?? '1080p60',
    latency_ms: body.latencyMs ?? null,
    status: 'booting' as const,
  };

  // Authenticated writes go through RLS; guest telemetry is capped by rate limit.
  const target = user ? sb : supabaseAdmin();
  const { data, error } = await target.from('game_sessions').insert(row).select('id,started_at').single();
  if (error) return fail(error.message, 500);

  await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user?.id ?? '');

  return json({ session: data, playMode: game.play_mode, status: game.status });
}

async function markStreaming(req: Request, body: z.infer<typeof streamingSchema>) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const target = user ? sb : supabaseAdmin();
  const { error } = await target
    .from('game_sessions')
    .update({ status: 'streaming', latency_ms: body.latencyMs ?? null, resolution: body.resolution ?? '1080p60', region: body.region ?? 'auto' })
    .eq('id', body.sessionId);
  if (error) return fail(error.message, 500);
  return json({ ok: true });
}

export async function PATCH(req: Request) {
  return endSession(req, endSchema.parse(await readJson(req)));
}

async function endSession(req: Request, body: z.infer<typeof endSchema>) {
  const l = endLimit(req);
  if (!l.ok) return fail('Too many requests', 429, { retryAfter: l.retryAfter });

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const target = user ? sb : supabaseAdmin();

  const { data: existing } = await target.from('game_sessions').select('id,user_id,game_id,duration_seconds').eq('id', body.sessionId).maybeSingle();
  if (!existing) return fail('Session not found', 404);
  if (user && existing.user_id && existing.user_id !== user.id) return fail('Forbidden', 403);

  const total = (existing.duration_seconds ?? 0) + body.durationSeconds;
  const { error } = await target
    .from('game_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds: total, status: body.status })
    .eq('id', body.sessionId);
  if (error) return fail(error.message, 500);

  if (user && existing.user_id === user.id && body.durationSeconds >= 30) {
    const xpGain = Math.min(240, Math.round(body.durationSeconds / 6));
    const coinGain = Math.min(60, Math.round(body.durationSeconds / 30));
    const { data: profile } = await sb.from('profiles').select('xp,coins,total_play_seconds,games_played').eq('id', user.id).maybeSingle();
    if (profile) {
      const xp = (profile.xp ?? 0) + xpGain;
      await sb
        .from('profiles')
        .update({
          xp,
          coins: (profile.coins ?? 0) + coinGain,
          level: Math.max(1, Math.floor(Math.sqrt(xp / 250)) + 1),
          total_play_seconds: (profile.total_play_seconds ?? 0) + body.durationSeconds,
          games_played: (profile.games_played ?? 0) + 1,
        })
        .eq('id', user.id);
      return json({ ok: true, xpGain, coinGain });
    }
  }

  return json({ ok: true });
}
