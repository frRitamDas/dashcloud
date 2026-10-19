import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import type { SessionEndInput, SessionStartInput, SessionStreamingInput } from './contracts';

export class SessionServiceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'SessionServiceError';
  }
}

export async function startSession(input: SessionStartInput) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user && !input.guestId) throw new SessionServiceError('A guest session identifier is required.', 400);

  const { data: game, error: gameError } = await db
    .from('games')
    .select('id,status,play_mode')
    .eq('slug', input.slug)
    .eq('published', true)
    .maybeSingle();

  if (gameError) {
    console.error('[sessions:game-lookup]', gameError.code, gameError.message);
    throw new SessionServiceError('Could not start a session right now.', 503);
  }
  if (!game) throw new SessionServiceError('Game not found.', 404);
  if (game.status === 'maintenance' || game.status === 'soon') {
    throw new SessionServiceError('This title is not currently available to launch.', 503);
  }

  const target = user ? db : supabaseAdmin();
  const { data: session, error } = await target
    .from('game_sessions')
    .insert({
      user_id: user?.id ?? null,
      guest_id: user ? null : input.guestId,
      game_id: game.id,
      region: input.region ?? 'auto',
      resolution: input.resolution ?? '1080p60',
      latency_ms: input.latencyMs ?? null,
      status: 'booting',
    })
    .select('id,started_at')
    .single();

  if (error || !session) {
    console.error('[sessions:start]', error?.code, error?.message);
    throw new SessionServiceError('Could not start a session right now.', 503);
  }

  if (user) await db.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
  return { session, playMode: game.play_mode, status: game.status };
}

export async function markSessionStreaming(input: SessionStreamingInput) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user && !input.guestId) throw new SessionServiceError('Guest session identifier is required.', 403);

  const target = user ? db : supabaseAdmin();
  const { data: existing, error: readError } = await target
    .from('game_sessions')
    .select('id,user_id,guest_id,status')
    .eq('id', input.sessionId)
    .maybeSingle();

  if (readError || !existing) throw new SessionServiceError('Session not found.', 404);
  if (user ? existing.user_id !== user.id : existing.user_id !== null || existing.guest_id !== input.guestId) {
    throw new SessionServiceError('You cannot update this session.', 403);
  }
  if (existing.status === 'ended' || existing.status === 'failed') {
    throw new SessionServiceError('This session has already ended.', 409);
  }

  const { error } = await target
    .from('game_sessions')
    .update({
      status: 'streaming',
      latency_ms: input.latencyMs ?? null,
      resolution: input.resolution ?? '1080p60',
      region: input.region ?? 'auto',
    })
    .eq('id', input.sessionId);

  if (error) {
    console.error('[sessions:streaming]', error.code, error.message);
    throw new SessionServiceError('Could not update the session.', 503);
  }
  return { ok: true };
}

export async function endSession(input: SessionEndInput) {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user && !input.guestId) throw new SessionServiceError('Guest session identifier is required.', 403);

  const target = user ? db : supabaseAdmin();
  const { data: existing, error: readError } = await target
    .from('game_sessions')
    .select('id,user_id,guest_id,game_id,duration_seconds,status')
    .eq('id', input.sessionId)
    .maybeSingle();

  if (readError || !existing) throw new SessionServiceError('Session not found.', 404);
  if (user ? existing.user_id !== user.id : existing.user_id !== null || existing.guest_id !== input.guestId) {
    throw new SessionServiceError('You cannot end this session.', 403);
  }
  if (existing.status === 'ended' || existing.status === 'failed') return { ok: true, alreadyEnded: true };

  const durationSeconds = (existing.duration_seconds ?? 0) + input.durationSeconds;
  const { error } = await target
    .from('game_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds, status: input.status })
    .eq('id', input.sessionId);

  if (error) {
    console.error('[sessions:end]', error.code, error.message);
    throw new SessionServiceError('Could not finish this session.', 503);
  }

  if (user && existing.user_id === user.id && input.durationSeconds >= 30) {
    const xpGain = Math.min(240, Math.round(input.durationSeconds / 6));
    const coinGain = Math.min(60, Math.round(input.durationSeconds / 30));
    const { data: profile } = await db.from('profiles').select('xp,coins,total_play_seconds,games_played').eq('id', user.id).maybeSingle();

    if (profile) {
      const xp = (profile.xp ?? 0) + xpGain;
      const { error: profileError } = await db
        .from('profiles')
        .update({
          xp,
          coins: (profile.coins ?? 0) + coinGain,
          level: Math.max(1, Math.floor(Math.sqrt(xp / 250)) + 1),
          total_play_seconds: (profile.total_play_seconds ?? 0) + input.durationSeconds,
          games_played: (profile.games_played ?? 0) + 1,
        })
        .eq('id', user.id);
      if (profileError) console.error('[sessions:progression]', profileError.code, profileError.message);
    }
    return { ok: true, xpGain, coinGain };
  }

  return { ok: true };
}
