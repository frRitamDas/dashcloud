import 'server-only';
import { supabaseAnon } from '@/lib/supabase/anon';
import type { Game, Profile } from '@/lib/supabase/types';

export async function getProfile(id: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabaseAnon().from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) console.error('[queries:profile]', error.code, error.message);
    return (data as unknown as Profile) ?? null;
  } catch (error) {
    console.error('[queries:profile]', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getPlayerFavorites(userId: string): Promise<Game[]> {
  try {
    const db = supabaseAnon();
    const { data, error } = await db.from('favorites').select('game_id').eq('user_id', userId);
    if (error) {
      console.error('[queries:player-favorites]', error.code, error.message);
      return [];
    }
    const ids = (data ?? []).map((row) => row.game_id as string);
    if (!ids.length) return [];
    const games = await db.from('games').select('*').in('id', ids).eq('published', true);
    if (games.error) console.error('[queries:favorite-games]', games.error.code, games.error.message);
    return (games.data ?? []) as unknown as Game[];
  } catch (error) {
    console.error('[queries:player-favorites]', error instanceof Error ? error.message : error);
    return [];
  }
}
