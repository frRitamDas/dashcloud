import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { OverviewData } from '@/components/admin/types';

/** Single source of truth for the control-plane payload (used by the page and the API route). */
export async function getAdminOverview(): Promise<OverviewData> {
  const db = supabaseAdmin();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, users7d, games, sessionsActive, sessionsToday, scoresTotal, ticketsOpen, statusRows, recentSessions, activity, announcements, settingsRows, playtime] =
    await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
      db.from('games').select('id,slug,title,accent,status,play_mode,published,sort_order'),
      db.from('game_sessions').select('id', { count: 'exact', head: true }).eq('status', 'streaming'),
      db.from('game_sessions').select('id', { count: 'exact', head: true }).gte('started_at', since24h),
      db.from('scores').select('id', { count: 'exact', head: true }),
      db.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('service_status').select('*').order('sort_order'),
      db
        .from('game_sessions')
        .select('id,region,status,resolution,latency_ms,started_at,ended_at,duration_seconds,user_id,guest_id,games(title,slug,accent),profiles(username,display_name)')
        .order('started_at', { ascending: false })
        .limit(25),
      db.from('activity_log').select('*').order('created_at', { ascending: false }).limit(30),
      db.from('announcements').select('*').order('created_at', { ascending: false }).limit(12),
      db.from('settings').select('*'),
      db.from('game_sessions').select('duration_seconds').gte('started_at', since7d),
    ]);

  const allGames = (games.data ?? []) as { id: string; slug: string; title: string; accent: string; status: string; play_mode: string; published: boolean; sort_order: number }[];
  const totalSeconds = (((playtime.data ?? []) as { duration_seconds: number }[])).reduce((s, r) => s + (r.duration_seconds ?? 0), 0);
  const statusList = (statusRows.data ?? []) as unknown as OverviewData['status'];
  const latencies = statusList.map((s) => s.latency_ms).filter((n) => typeof n === 'number');

  const buckets = Array.from({ length: 24 }, (_, i) => ({
    label: `${(new Date().getHours() - 23 + i + 24) % 24}`.padStart(2, '0'),
    value: 0,
  }));
  for (const row of (recentSessions.data ?? []) as { started_at: string }[]) {
    const started = new Date(row.started_at).getTime();
    const hoursAgo = Math.floor((Date.now() - started) / 3_600_000);
    if (hoursAgo >= 0 && hoursAgo < 24) buckets[23 - hoursAgo].value += 1;
  }

  return {
    kpis: {
      users: users.count ?? 0,
      newUsers7d: users7d.count ?? 0,
      games: allGames.length,
      gamesPublished: allGames.filter((g) => g.published).length,
      gamesNative: allGames.filter((g) => g.play_mode === 'native').length,
      activeSessions: sessionsActive.count ?? 0,
      sessions24h: sessionsToday.count ?? 0,
      scores: scoresTotal.count ?? 0,
      openTickets: ticketsOpen.count ?? 0,
      playtimeHours7d: Math.round(totalSeconds / 3600),
      avgLatency: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      healthyServices: statusList.filter((s) => s.status === 'operational').length,
      totalServices: statusList.length,
    },
    status: statusList,
    recentSessions: (recentSessions.data ?? []) as unknown as OverviewData['recentSessions'],
    activity: (activity.data ?? []) as unknown as OverviewData['activity'],
    announcements: (announcements.data ?? []) as unknown as OverviewData['announcements'],
    settings: (settingsRows.data ?? []) as unknown as OverviewData['settings'],
    sparkline: buckets,
    games: allGames
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => ({ id: g.id, slug: g.slug, title: g.title, accent: g.accent, status: g.status, play_mode: g.play_mode })),
  };
}
