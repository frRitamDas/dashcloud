import 'server-only';
import { supabaseAnon } from '@/lib/supabase/anon';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type {
  Announcement,
  Game,
  LiveStats,
  Profile,
  ScoreRow,
  ServiceStatus,
  SiteSettings,
  StatsSettings,
} from '@/lib/supabase/types';

export type GameSort = 'popular' | 'rating' | 'newest' | 'az';

const defaultSettings: SiteSettings = {
  name: 'Dash',
  fullName: 'Dash Cloud Gaming',
  tagline: 'Play anything. Anywhere. Instantly.',
  description:
    'Dash is a free cloud gaming service — stream premium titles straight into your browser with zero downloads, zero installs and zero waiting.',
  supportEmail: 'support@dash.gg',
  credits: 'Made by Ritam Das from India',
};

const defaultStats: StatsSettings = {
  totalPlayers: 1284500,
  gamesHosted: 32,
  countries: 74,
  avgBootSeconds: 9,
  uptimePercent: 99.98,
};

export async function getSiteSettings(): Promise<{ site: SiteSettings; stats: StatsSettings; maintenance: { enabled: boolean; message: string }; streaming: Record<string, string> }> {
  try {
    const db = supabaseAnon();
    const { data } = await db
      .from('settings')
      .select('key,value')
      .in('key', ['site', 'stats', 'maintenance', 'streaming']);
    const map = new Map((data ?? []).map((row) => [row.key as string, row.value as Record<string, unknown>]));
    return {
      site: { ...defaultSettings, ...((map.get('site') ?? {}) as Partial<SiteSettings>) },
      stats: { ...defaultStats, ...((map.get('stats') ?? {}) as Partial<StatsSettings>) },
      maintenance: (map.get('maintenance') as { enabled: boolean; message: string }) ?? { enabled: false, message: '' },
      streaming: (map.get('streaming') as Record<string, string>) ?? {},
    };
  } catch {
    return { site: defaultSettings, stats: defaultStats, maintenance: { enabled: false, message: '' }, streaming: {} };
  }
}

export async function getGames(opts: {
  genre?: string;
  search?: string;
  sort?: GameSort;
  playMode?: 'native' | 'cloud';
  status?: Game['status'];
  featuredOnly?: boolean;
  limit?: number;
} = {}): Promise<Game[]> {
  const db = supabaseAnon();
  let query = db.from('games').select('*').eq('published', true);

  if (opts.genre && opts.genre !== 'all') query = query.eq('genre', opts.genre);
  if (opts.playMode) query = query.eq('play_mode', opts.playMode);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.featuredOnly) query = query.eq('featured', true);
  if (opts.search) {
    const term = opts.search.replace(/[%_,()]/g, ' ').trim();
    if (term) query = query.or(`title.ilike.%${term}%,tagline.ilike.%${term}%,genre.ilike.%${term}%`);
  }

  switch (opts.sort) {
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'newest':
      query = query.order('release_year', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'az':
      query = query.order('title', { ascending: true });
      break;
    case 'popular':
    default:
      query = query.order('sort_order', { ascending: true }).order('players_online', { ascending: false });
      break;
  }

  query = query.limit(opts.limit ?? 60);
  const { data } = await query;
  return (data ?? []) as unknown as Game[];
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const db = supabaseAnon();
  const { data } = await db.from('games').select('*').eq('slug', slug).maybeSingle();
  return (data as unknown as Game) ?? null;
}

export async function getGenres(): Promise<string[]> {
  const games = await getGames({ limit: 200 });
  const set = new Set(games.map((g) => g.genre));
  return Array.from(set).sort();
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  const db = supabaseAnon();
  const { data } = await db.from('service_status').select('*').order('sort_order', { ascending: true });
  return (data ?? []) as unknown as ServiceStatus[];
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const db = supabaseAnon();
  const { data } = await db.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5);
  return (data ?? []) as unknown as Announcement[];
}

export async function getLeaderboard(slug: string, limit = 25): Promise<ScoreRow[]> {
  const db = supabaseAnon();
  const game = await getGameBySlug(slug);
  if (!game) return [];
  const { data } = await db
    .from('scores')
    .select('id,user_id,guest_name,game_id,score,metric,payload,created_at,profiles(username,display_name,avatar_url,level)')
    .eq('game_id', game.id)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ScoreRow[];
}

export async function getGlobalTopScores(limit = 12): Promise<ScoreRow[]> {
  const db = supabaseAnon();
  const { data } = await db
    .from('scores')
    .select('id,user_id,guest_name,game_id,score,metric,created_at,profiles(username,display_name,avatar_url,level),games(slug,title,accent)')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ScoreRow[];
}

export async function getLiveStats(): Promise<LiveStats> {
  try {
    const db = supabaseAdmin();
    const since = new Date(Date.now() - 1000 * 60 * 15).toISOString();

    const [gamesRes, activeRes, statusRes, totalsRes] = await Promise.all([
      db.from('games').select('players_online,status').eq('published', true),
      db.from('game_sessions').select('id').eq('status', 'streaming').gte('started_at', since),
      db.from('service_status').select('status,latency_ms'),
      db.from('games').select('id', { count: 'exact', head: true }).eq('published', true).eq('status', 'live'),
    ]);

    const games = (gamesRes.data ?? []) as unknown as { players_online: number; status: string }[];
    const statuses = (statusRes.data ?? []) as unknown as { status: string; latency_ms: number }[];
    const playersOnline = games.reduce((sum, g) => sum + (g.players_online || 0), 0);
    const latencies = statuses.map((s) => s.latency_ms || 0).filter((v) => v > 0);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    return {
      playersOnline,
      activeSessions: (activeRes.data ?? []).length,
      gamesLive: totalsRes.count ?? games.filter((g) => g.status === 'live').length,
      avgLatency,
      queueLength: Math.max(0, Math.round(playersOnline / 340)),
      uptime: statuses.length ? Math.round((statuses.filter((s) => s.status === 'operational').length / statuses.length) * 10000) / 100 : 100,
      degraded: statuses.filter((s) => s.status !== 'operational').length,
    };
  } catch {
    return { playersOnline: 0, activeSessions: 0, gamesLive: 0, avgLatency: 0, queueLength: 0, uptime: 100, degraded: 0 };
  }
}

export async function getProfile(id: string): Promise<Profile | null> {
  const db = supabaseAnon();
  const { data } = await db.from('profiles').select('*').eq('id', id).maybeSingle();
  return (data as unknown as Profile) ?? null;
}

export async function getPlayerScores(userId: string, limit = 40): Promise<ScoreRow[]> {
  const db = supabaseAnon();
  const { data } = await db
    .from('scores')
    .select('id,score,metric,created_at,game_id,payload,games(slug,title,accent)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ScoreRow[];
}

export async function getPlayerFavorites(userId: string): Promise<Game[]> {
  const db = supabaseAnon();
  const { data } = await db.from('favorites').select('game_id').eq('user_id', userId);
  const ids = (data ?? []).map((row) => row.game_id as string);
  if (!ids.length) return [];
  const res = await db.from('games').select('*').in('id', ids);
  return (res.data ?? []) as unknown as Game[];
}
