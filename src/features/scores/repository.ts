import 'server-only';
import { supabaseAnon } from '@/lib/supabase/anon';
import { findGameBySlug } from '@/features/games/repository';
import type { ScoreRow } from '@/lib/supabase/types';

export async function getLeaderboard(slug: string, limit = 25): Promise<ScoreRow[]> {
  try {
    const db = supabaseAnon();
    const game = await findGameBySlug(slug);
    if (!game) return [];
    const { data, error } = await db
      .from('scores')
      .select('id,user_id,guest_name,game_id,score,metric,payload,created_at,profiles(username,display_name,avatar_url,level)')
      .eq('game_id', game.id)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(100, Math.trunc(limit))));
    if (error) console.error('[queries:leaderboard]', error.code, error.message);
    return (data ?? []) as unknown as ScoreRow[];
  } catch (error) {
    console.error('[queries:leaderboard]', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getGlobalTopScores(limit = 12): Promise<ScoreRow[]> {
  try {
    const { data, error } = await supabaseAnon()
      .from('scores')
      .select('id,user_id,guest_name,game_id,score,metric,created_at,profiles(username,display_name,avatar_url,level),games(slug,title,accent)')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(50, Math.trunc(limit))));
    if (error) console.error('[queries:global-scores]', error.code, error.message);
    return (data ?? []) as unknown as ScoreRow[];
  } catch (error) {
    console.error('[queries:global-scores]', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPlayerScores(userId: string, limit = 40): Promise<ScoreRow[]> {
  try {
    const { data, error } = await supabaseAnon()
      .from('scores')
      .select('id,score,metric,created_at,game_id,payload,games(slug,title,accent)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(100, Math.trunc(limit))));
    if (error) console.error('[queries:player-scores]', error.code, error.message);
    return (data ?? []) as unknown as ScoreRow[];
  } catch (error) {
    console.error('[queries:player-scores]', error instanceof Error ? error.message : error);
    return [];
  }
}
