import 'server-only';

import type { Game } from '@/lib/supabase/types';
import { findGameBySlug, listPublishedGames } from './repository';
import type { GameListQuery } from './contracts';

/**
 * Application service boundary for the game catalogue.
 * Validation lives in contracts, persistence in repository, and HTTP/UI layers
 * consume this service without importing Supabase directly.
 */
export async function listGames(input: GameListQuery): Promise<Game[]> {
  return listPublishedGames({
    search: input.q || undefined,
    genre: input.genre && input.genre !== 'all' ? input.genre : undefined,
    playMode: input.mode,
    sort: input.sort,
    limit: input.limit,
  });
}

export async function findPublishedGame(slug: string): Promise<Game | null> {
  return findGameBySlug(slug);
}
