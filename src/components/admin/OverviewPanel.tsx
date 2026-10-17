'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { OverviewData } from './types';
import { StatusDot } from '@/components/ui/Badge';
import {
  IconActivity,
  IconBolt,
  IconChart,
  IconClock,
  IconCpu,
  IconExternal,
  IconGamepad,
  IconServer,
  IconTicket,
  IconTrophy,
  IconUsers,
  IconWifi,
} from '@/components/ui/Icons';
import { cn, timeAgo, withAlpha } from '@/lib/utils';

export type { OverviewData };

export function OverviewPanel({
  data,
  onRefresh,
  onNavigate,
}: {
  data: OverviewData;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}) {
  const { kpis, sparkline, status, recentSessions, activity } = data;
  const peak = Math.max(1, ...sparkline.map((b) => b.value));

  const cards = [
    { label: 'Registered players', value: kpis.users, sub: `+${kpis.newUsers7d} this week`, icon: <IconUsers width={15} height={15} />, tone: '#9ba3ff' },
    { label: 'Streaming now', value: kpis.activeSessions, sub: `${kpis.sessions24h} in 24h`, icon: <IconBolt width={15} height={15} />, tone: '#4ade80', live: true },
    { label: 'Playtime (7d)', value: kpis.playtimeHours7d, sub: 'hours across all regions', icon: <IconClock width={15} height={15} />, tone: '#22d3ee' },
    { label: 'Scores submitted', value: kpis.scores, sub: 'all-time leaderboard rows', icon: <IconTrophy width={15} height={15} />, tone: '#fbbf24' },
    { label: 'Catalogue', value: kpis.games, sub: `${kpis.gamesPublished} published · ${kpis.gamesNative} native`, icon: <IconGamepad width={15} height={15} />, tone: '#a78bfa' },
    { label: 'Open tickets', value: kpis.openTickets, sub: kpis.openTickets ? 'needs attention' : 'inbox clear', icon: <IconTicket width={15} height={15} />, tone: '#fb7185' },
    { label: 'Average latency', value: kpis.avgLatency, suffix: ' ms', sub: 'across healthy regions', icon: <IconWifi width={15} height={15} />, tone: '#67e8f9' },
    { label: 'Service health', value: kpis.healthyServices, suffix: `/${kpis.totalServices}`, sub: 'components operational', icon: <IconServer width={15} height={15} />, tone: '#86efac' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.035, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4 transition-colors hover:border-white/[0.14]"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45" style={{ background: c.tone }} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">{c.label}</p>
                <p className="mt-1.5 font-mono text-[27px] font-bold leading-none tabular-nums text-white">
                  {c.value.toLocaleString()}
                  {c.suffix && <span className="ml-0.5 text-[15px] text-white/45">{c.suffix}</span>}
                </p>
                <p className="mt-2 text-[11.5px] text-[color:var(--text-dim)]">{c.sub}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05]" style={{ color: c.tone }}>
                {c.icon}
                {c.live && kpis.activeSessions > 0 && <span className="absolute -mr-5 -mt-5 h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#4ade80]" />}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* sparkline */}
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight text-white">Session starts · last 24 hours</h2>
              <p className="mt-0.5 text-[11.5px] text-[color:var(--text-faint)]">Peak {peak} in a single hour</p>
            </div>
            <button onClick={onRefresh} className="btn-ghost !py-1.5 !text-[11.5px]">
              <IconActivity width={13} height={13} /> Refresh
            </button>
          </div>
          <div className="flex h-[132px] items-end gap-[3px]">
            {sparkline.map((b, i) => (
              <motion.div
                key={b.label + i}
                className="group relative flex-1"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(3, (b.value / peak) * 100)}%` }}
                transition={{ delay: i * 0.012, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={cn('h-full w-full rounded-t-[3px] transition-colors', b.value ? 'bg-brand-500/70 group-hover:bg-brand-400' : 'bg-white/[0.07]')}
                  title={`${b.label}:00 — ${b.value} sessions`}
                />
              </motion.div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-[color:var(--text-faint)]">
            <span>{sparkline[0]?.label}:00</span>
            <span>{sparkline[Math.floor(sparkline.length / 2)]?.label}:00</span>
            <span>{sparkline[sparkline.length - 1]?.label}:00</span>
          </div>
        </section>

        {/* region health */}
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-white">
              <IconCpu width={15} height={15} className="text-brand-300" /> Region health
            </h2>
            <button onClick={() => onNavigate('live')} className="text-[11.5px] font-semibold text-brand-300 hover:text-brand-200">
              Manage →
            </button>
          </div>
          <div className="space-y-2">
            {status.map((s) => {
              const tone = s.status === 'operational' ? '#4ade80' : s.status === 'degraded' ? '#fbbf24' : '#fb7185';
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <StatusDot status={s.status} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-white">{s.service || s.region}</span>
                    <span className="block font-mono text-[10.5px] text-[color:var(--text-faint)]">
                      {s.region_code} · {s.latency_ms}ms · {s.gpu_pool ?? '—'}
                    </span>
                  </span>
                  <span className="w-16 shrink-0">
                    <span className="mb-1 block text-right font-mono text-[10.5px] tabular-nums" style={{ color: tone }}>
                      {s.load_percent}%
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: tone }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, s.load_percent)}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* recent sessions */}
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-white">
              <IconChart width={15} height={15} className="text-brand-300" /> Latest sessions
            </h2>
            <button onClick={() => onNavigate('sessions')} className="text-[11.5px] font-semibold text-brand-300 hover:text-brand-200">
              View all →
            </button>
          </div>
          <div className="divide-y divide-white/[0.045]">
            {recentSessions.length === 0 && <p className="px-5 py-10 text-center text-[12.5px] text-[color:var(--text-faint)]">No sessions recorded yet.</p>}
            {recentSessions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.status === 'streaming' ? '#4ade80' : s.status === 'booting' ? '#fbbf24' : s.status === 'failed' ? '#fb7185' : '#475569' }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-white">{s.games?.title ?? 'Unknown title'}</span>
                  <span className="block truncate text-[11px] text-[color:var(--text-faint)]">
                    {s.profiles?.display_name || s.profiles?.username || s.guest_id?.slice(0, 8) || 'guest'} · {s.region ?? 'auto'} · {s.resolution ?? '—'}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-[11.5px] tabular-nums text-white/70">{s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : '—'}</span>
                  <span className="block text-[10.5px] text-[color:var(--text-faint)]">{timeAgo(s.started_at)}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* activity */}
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-white">
              <IconActivity width={15} height={15} className="text-neon-mint" /> Operator activity
            </h2>
            <button onClick={() => onNavigate('activity')} className="text-[11.5px] font-semibold text-brand-300 hover:text-brand-200">
              Full log →
            </button>
          </div>
          <div className="divide-y divide-white/[0.045]">
            {activity.length === 0 && <p className="px-5 py-10 text-center text-[12.5px] text-[color:var(--text-faint)]">No operator actions recorded yet.</p>}
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[11.5px] text-white/85">{a.action}</span>
                  <span className="block truncate text-[11px] text-[color:var(--text-faint)]">
                    {a.actor ?? 'system'}
                    {a.entity ? ` · ${a.entity}${a.entity_id ? ` ${a.entity_id.slice(0, 8)}` : ''}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-[10.5px] text-[color:var(--text-faint)]">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* quick actions */}
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
        <h2 className="mb-3.5 text-[14px] font-semibold tracking-tight text-white">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Edit live region status', href: null, tab: 'live', icon: <IconServer width={14} height={14} /> },
            { label: 'Add a game', href: null, tab: 'games', icon: <IconGamepad width={14} height={14} /> },
            { label: 'Post an announcement', href: null, tab: 'settings', icon: <IconTicket width={14} height={14} /> },
            { label: 'Review tickets', href: null, tab: 'tickets', icon: <IconTicket width={14} height={14} /> },
            { label: 'Public site', href: '/', icon: <IconExternal width={14} height={14} /> },
            { label: 'Status page', href: '/status', icon: <IconExternal width={14} height={14} /> },
            { label: 'Leaderboards', href: '/leaderboard', icon: <IconTrophy width={14} height={14} /> },
          ].map((a) =>
            a.href ? (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
              >
                {a.icon} {a.label}
              </Link>
            ) : (
              <button
                key={a.label}
                onClick={() => onNavigate(a.tab!)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-white/80 transition-colors hover:border-white/20 hover:text-white"
              >
                {a.icon} {a.label}
              </button>
            ),
          )}
        </div>
        <p className="mt-4 text-[11px] text-[color:var(--text-faint)]">
          Tip: press <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10.5px]">Alt</kbd> +{' '}
          <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10.5px]">1…9</kbd> to jump between panels.
        </p>
      </section>
    </div>
  );
}

export { withAlpha };
