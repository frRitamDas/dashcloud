import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import type { ScoreSubmission } from '@/features/games/contracts';

export class ScoreSubmissionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ScoreSubmissionError';
  }
}

export async function submitScore(input: ScoreSubmission) {
  const client = await supabaseServer();
  const { data: { user } } = await client.auth.getUser();

  if (!user && !input.guestName) {
    throw new ScoreSubmissionError('Sign in or enter a player name to save scores.', 401);
  }

  const { data: game, error: gameError } = await client
    .from('games')
    .select('id,slug')
    .eq('slug', input.slug)
    .eq('published', true)
    .maybeSingle();

  if (gameError) {
    console.error('[scores:game-lookup]', gameError.code, gameError.message);
    throw new ScoreSubmissionError('Score submission is temporarily unavailable.', 503);
  }
  if (!game) throw new ScoreSubmissionError('Game not found.', 404);

  const target = user ? client : supabaseAdmin();
  const { data: score, error: insertError } = await target
    .from('scores')
    .insert({
      user_id: user?.id ?? null,
      guest_name: user ? null : input.guestName,
      game_id: game.id,
      score: input.score,
      metric: input.metric,
      payload: input.payload ?? {},
    })
    .select('id,score,created_at')
    .single();

  if (insertError || !score) {
    console.error('[scores:insert]', insertError?.code, insertError?.message);
    throw new ScoreSubmissionError('Could not save this score. Please try again.', 503);
  }

  const { count, error: rankError } = await target
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', game.id)
    .gt('score', input.score);

  if (rankError) console.error('[scores:rank]', rankError.code, rankError.message);

  if (user) {
    const xpGain = Math.min(120, 20 + Math.round(input.score / 400));
    const { data: profile } = await client.from('profiles').select('xp,coins').eq('id', user.id).maybeSingle();
    if (profile) {
      const xp = (profile.xp ?? 0) + xpGain;
      const { error } = await client
        .from('profiles')
        .update({
          xp,
          coins: (profile.coins ?? 0) + Math.min(25, Math.round(xpGain / 4)),
          level: Math.max(1, Math.floor(Math.sqrt(xp / 250)) + 1),
        })
        .eq('id', user.id);
      if (error) console.error('[scores:progression]', error.code, error.message);
    }
  }

  return { score, rank: (count ?? 0) + 1 };
}
