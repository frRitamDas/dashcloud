import 'server-only';
import { supabaseAnon } from '@/lib/supabase/anon';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Announcement, LiveStats, ServiceStatus, SiteSettings, StatsSettings } from '@/lib/supabase/types';

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
  // Unknown metrics stay unknown; never show invented production statistics.
  totalPlayers: 0,
  gamesHosted: 0,
  countries: 0,
  avgBootSeconds: 0,
  uptimePercent: 0,
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

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  try {
    const { data, error } = await supabaseAnon().from('service_status').select('*').order('sort_order', { ascending: true });
    if (error) console.error('[queries:service-status]', error.code, error.message);
    return (data ?? []) as unknown as ServiceStatus[];
  } catch (error) {
    console.error('[queries:service-status]', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabaseAnon().from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5);
    if (error) console.error('[queries:announcements]', error.code, error.message);
    return (data ?? []) as unknown as Announcement[];
  } catch (error) {
    console.error('[queries:announcements]', error instanceof Error ? error.message : error);
    return [];
  }
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
      uptime: statuses.length ? Math.round((statuses.filter((s) => s.status === 'operational').length / statuses.length) * 10000) / 100 : 0,
      degraded: statuses.filter((s) => s.status !== 'operational').length,
    };
  } catch {
    return { playersOnline: 0, activeSessions: 0, gamesLive: 0, avgLatency: 0, queueLength: 0, uptime: 0, degraded: 0 };
  }
}
