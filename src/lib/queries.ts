import 'server-only';

import { findGameBySlug, listGameGenres, listPublishedGames, type GameFilters, type GameSort } from '@/features/games/repository';
import type { Game } from '@/lib/supabase/types';

export type { GameSort } from '@/features/games/repository';
export { getSiteSettings, getServiceStatus, getAnnouncements, getLiveStats } from '@/features/site/repository';
export { getLeaderboard, getGlobalTopScores, getPlayerScores } from '@/features/scores/repository';
export { getProfile, getPlayerFavorites } from '@/features/profiles/repository';

/** Compatibility facade while page modules migrate to feature imports. */
export async function getGames(filters: GameFilters = {}): Promise<Game[]> {
  try {
    return await listPublishedGames(filters);
  } catch {
    return [];
  }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  try {
    return await findGameBySlug(slug);
  } catch {
    return null;
  }
}

export async function getGenres(): Promise<string[]> {
  try {
    return await listGameGenres();
  } catch {
    return [];
  }
}
