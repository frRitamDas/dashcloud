import 'server-only';

import { getGameBySlug, getGames, type GameSort } from '@/lib/queries';
import type { Game } from '@/lib/supabase/types';
import type { GameListQuery } from './contracts';

/**
 * Feature boundary for catalogue reads.
 * Route handlers and pages consume this service instead of knowing how
 * the catalogue is queried or which persistence provider backs it.
 */
export async function listGames(input: GameListQuery): Promise<Game[]> {
  return getGames({
    search: input.q || undefined,
    genre: input.genre && input.genre !== 'all' ? input.genre : undefined,
    playMode: input.mode,
    sort: input.sort as GameSort,
    limit: input.limit,
  });
}

export async function findPublishedGame(slug: string): Promise<Game | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || normalizedSlug.length > 80) return null;
  const game = await getGameBySlug(normalizedSlug);
  return game?.published ? game : null;
}
