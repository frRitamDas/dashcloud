import 'server-only';

import { supabaseAnon } from '@/lib/supabase/anon';
import type { Game } from '@/lib/supabase/types';

export type GameSort = 'popular' | 'rating' | 'newest' | 'az';

export interface GameFilters {
  genre?: string;
  search?: string;
  sort?: GameSort;
  playMode?: 'native' | 'cloud';
  status?: Game['status'];
  featuredOnly?: boolean;
  limit?: number;
}

const MAX_CATALOGUE_LIMIT = 200;

export async function listPublishedGames(filters: GameFilters = {}): Promise<Game[]> {
  const db = supabaseAnon();
  let query = db.from('games').select('*').eq('published', true);

  if (filters.genre && filters.genre !== 'all') query = query.eq('genre', filters.genre);
  if (filters.playMode) query = query.eq('play_mode', filters.playMode);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.featuredOnly) query = query.eq('featured', true);

  const search = filters.search?.replace(/[%_,()]/g, ' ').trim().slice(0, 80);
  if (search) query = query.or(`title.ilike.%${search}%,tagline.ilike.%${search}%,genre.ilike.%${search}%`);

  switch (filters.sort) {
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'newest':
      query = query.order('release_year', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'az':
      query = query.order('title', { ascending: true });
      break;
    default:
      query = query.order('sort_order', { ascending: true }).order('players_online', { ascending: false });
  }

  const limit = Math.min(MAX_CATALOGUE_LIMIT, Math.max(1, Math.trunc(filters.limit ?? 60)));
  const { data, error } = await query.limit(limit);
  if (error) {
    console.error('[games:repository:list]', error.code, error.message);
    throw new Error('Game catalogue query failed');
  }

  return (data ?? []) as unknown as Game[];
}

export async function findGameBySlug(slug: string): Promise<Game | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || normalizedSlug.length > 80) return null;

  const { data, error } = await supabaseAnon()
    .from('games')
    .select('*')
    .eq('slug', normalizedSlug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('[games:repository:find]', error.code, error.message);
    throw new Error('Game lookup failed');
  }

  return (data as unknown as Game) ?? null;
}

export async function listGameGenres(): Promise<string[]> {
  const games = await listPublishedGames({ limit: MAX_CATALOGUE_LIMIT, sort: 'az' });
  return Array.from(new Set(games.map((game) => game.genre))).sort((a, b) => a.localeCompare(b));
}
