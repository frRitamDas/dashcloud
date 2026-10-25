'use client';

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
  IconArrowRight,
} from '@/components/ui/Icons';
import { formatNumber, timeAgo } from '@/lib/utils';

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
  const peak = Math.max(1, ...sparkline.map((bucket) => bucket.value));
  const cards = [
    { label: 'Registered players', value: formatNumber(kpis.users), detail: `+${formatNumber(kpis.newUsers7d)} this week`, icon: <IconUsers width={15} height={15} /> },
    { label: 'Streaming now', value: formatNumber(kpis.activeSessions), detail: `${formatNumber(kpis.sessions24h)} sessions in 24 hours`, icon: <IconBolt width={15} height={15} /> },
    { label: 'Playtime · 7 days', value: formatNumber(kpis.playtimeHours7d), detail: 'Hours across all regions', icon: <IconClock width={15} height={15} /> },
    { label: 'Scores submitted', value: formatNumber(kpis.scores), detail: 'All-time leaderboard rows', icon: <IconTrophy width={15} height={15} /> },
    { label: 'Game catalogue', value: formatNumber(kpis.games), detail: `${kpis.gamesPublished} published · ${kpis.gamesNative} browser games`, icon: <IconGamepad width={15} height={15} /> },
    { label: 'Open tickets', value: formatNumber(kpis.openTickets), detail: kpis.openTickets ? 'Requires attention' : 'Inbox clear', icon: <IconTicket width={15} height={15} /> },
    { label: 'Average latency', value: `${formatNumber(kpis.avgLatency)} ms`, detail: 'Across reporting regions', icon: <IconWifi width={15} height={15} /> },
    { label: 'Service health', value: `${kpis.healthyServices}/${kpis.totalServices}`, detail: 'Components operational', icon: <IconServer width={15} height={15} /> },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">Workspace / Overview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.045em] text-white sm:text-3xl">Platform at a glance</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">Current usage, service health and recent activity in one place.</p>
          </div>
          <button onClick={onRefresh} className="btn-outline w-fit !py-2 !text-xs"><IconActivity width={14} height={14} /> Refresh data</button>
        </div>
        <div className="grid gap-0 border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="min-w-0 border-b border-r border-white/10 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-neutral-500">{card.icon}<span className="text-[10px] font-bold uppercase tracking-[.13em]">{card.label}</span></div>
              <p className="mt-4 break-words text-2xl font-bold tracking-tight tabular-nums text-white">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-neutral-500">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h3 className="text-base font-bold text-white">Session starts</h3><p className="mt-1 text-xs text-neutral-500">Hourly activity over the last 24 hours · peak {peak}</p></div>
            <span className="font-mono text-[10px] text-neutral-600">24H</span>
          </div>
          <div className="flex h-36 items-end gap-1 border-b border-l border-white/10 pb-0 pl-2">
            {sparkline.map((bucket, index) => (
              <div key={bucket.label + index} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${bucket.label}:00 — ${bucket.value} sessions`}>
                <div className={`w-full ${bucket.value ? 'bg-neutral-300 group-hover:bg-white' : 'bg-neutral-800'}`} style={{ height: `${Math.max(3, (bucket.value / peak) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-neutral-600">
            <span>{sparkline[0]?.label ?? '—'}:00</span><span>{sparkline[Math.floor(sparkline.length / 2)]?.label ?? '—'}:00</span><span>{sparkline[sparkline.length - 1]?.label ?? '—'}:00</span>
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h3 className="text-base font-bold text-white">Service health</h3><p className="mt-1 text-xs text-neutral-500">Status reported by configured regions</p></div>
            <button onClick={() => onNavigate('live')} className="inline-flex items-center gap-1 text-xs font-bold text-neutral-300 hover:text-white">Manage <IconArrowRight width={13} height={13} /></button>
          </div>
          <div className="border-t border-white/10">
            {status.length === 0 && <p className="border-b border-white/10 py-6 text-sm text-neutral-500">No region health data is available.</p>}
            {status.map((service) => (
              <div key={service.id} className="flex items-center gap-3 border-b border-white/10 py-3">
                <StatusDot status={service.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-200">{service.service || service.region}</p>
                  <p className="mt-1 truncate text-[11px] text-neutral-500">{service.region_code} · {service.latency_ms} ms · {service.gpu_pool ?? 'No pool specified'}</p>
                </div>
                <div className="w-20 shrink-0">
                  <div className="mb-1 flex justify-between text-[10px] text-neutral-500"><span>Load</span><span>{service.load_percent}%</span></div>
                  <div className="h-1 bg-neutral-800"><div className="h-full bg-neutral-300" style={{ width: `${Math.min(100, Math.max(0, service.load_percent))}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h3 className="text-base font-bold text-white">Recent sessions</h3><p className="mt-1 text-xs text-neutral-500">Latest player activity</p></div><button onClick={() => onNavigate('sessions')} className="text-xs font-bold text-neutral-300 hover:text-white">View sessions →</button></div>
          <div className="border-t border-white/10">
            {recentSessions.length === 0 && <p className="border-b border-white/10 py-8 text-sm text-neutral-500">No sessions recorded yet.</p>}
            {recentSessions.slice(0, 8).map((session) => (
              <div key={session.id} className="flex items-center gap-3 border-b border-white/10 py-3">
                <span className={`h-2 w-2 shrink-0 ${session.status === 'streaming' ? 'bg-white' : session.status === 'booting' ? 'bg-neutral-500' : session.status === 'failed' ? 'bg-neutral-700' : 'bg-neutral-800'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-200">{session.games?.title ?? 'Unknown title'}</p>
                  <p className="mt-1 truncate text-[11px] text-neutral-500">{session.profiles?.display_name || session.profiles?.username || session.guest_id?.slice(0, 8) || 'Guest'} · {session.region ?? 'Auto'} · {session.resolution ?? '—'}</p>
                </div>
                <div className="shrink-0 text-right"><p className="font-mono text-xs text-neutral-300">{session.duration_seconds ? `${Math.round(session.duration_seconds / 60)}m` : '—'}</p><p className="mt-1 text-[10px] text-neutral-600">{timeAgo(session.started_at)}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h3 className="text-base font-bold text-white">Operator activity</h3><p className="mt-1 text-xs text-neutral-500">Recent administrative changes</p></div><button onClick={() => onNavigate('activity')} className="text-xs font-bold text-neutral-300 hover:text-white">Open audit trail →</button></div>
          <div className="border-t border-white/10">
            {activity.length === 0 && <p className="border-b border-white/10 py-8 text-sm text-neutral-500">No operator actions recorded yet.</p>}
            {activity.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 border-b border-white/10 py-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-neutral-400" />
                <div className="min-w-0 flex-1"><p className="truncate font-mono text-xs text-neutral-200">{entry.action}</p><p className="mt-1 truncate text-[11px] text-neutral-500">{entry.actor ?? 'System'}{entry.entity ? ` · ${entry.entity}${entry.entity_id ? ` ${entry.entity_id.slice(0, 8)}` : ''}` : ''}</p></div>
                <span className="shrink-0 text-[10px] text-neutral-600">{timeAgo(entry.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4"><h3 className="text-base font-bold text-white">Quick actions</h3><p className="mt-1 text-xs text-neutral-500">Jump directly to common tasks.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Manage game catalogue', detail: 'Publish or edit titles', tab: 'games', icon: <IconGamepad width={15} height={15} /> },
            { label: 'Check region health', detail: 'Review availability', tab: 'live', icon: <IconServer width={15} height={15} /> },
            { label: 'Review support tickets', detail: `${kpis.openTickets} open`, tab: 'tickets', icon: <IconTicket width={15} height={15} /> },
            { label: 'Update site settings', detail: 'Content and announcements', tab: 'settings', icon: <IconCpu width={15} height={15} /> },
          ].map((action) => (
            <button key={action.tab} onClick={() => onNavigate(action.tab)} className="flex min-h-[86px] items-start gap-3 border border-white/10 p-4 text-left transition-colors hover:border-white/30 hover:bg-white/[0.03]">
              <span className="mt-0.5 text-neutral-400">{action.icon}</span><span><span className="block text-sm font-bold text-white">{action.label}</span><span className="mt-1 block text-xs text-neutral-500">{action.detail}</span></span>
            </button>
          ))}
          <Link href="/" className="flex min-h-[86px] items-start gap-3 border border-white/10 p-4 transition-colors hover:border-white/30 hover:bg-white/[0.03]"><IconExternal width={15} height={15} className="mt-0.5 text-neutral-400" /><span><span className="block text-sm font-bold text-white">Open public site</span><span className="mt-1 block text-xs text-neutral-500">View the player experience</span></span></Link>
          <Link href="/leaderboard" className="flex min-h-[86px] items-start gap-3 border border-white/10 p-4 transition-colors hover:border-white/30 hover:bg-white/[0.03]"><IconTrophy width={15} height={15} className="mt-0.5 text-neutral-400" /><span><span className="block text-sm font-bold text-white">View leaderboard</span><span className="mt-1 block text-xs text-neutral-500">Public scores and rankings</span></span></Link>
        </div>
        <p className="mt-4 text-[11px] text-neutral-600">Keyboard shortcut: Alt + 1–9 switches between admin sections.</p>
      </section>
    </div>
  );
}
