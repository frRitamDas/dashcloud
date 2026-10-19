'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { LiveStats, ServiceStatus } from '@/lib/supabase/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';
import { StatusDot } from '@/components/ui/Badge';
import { IconActivity, IconCpu, IconRefresh, IconServer, IconWifi } from '@/components/ui/Icons';
import { cn, timeAgo, withAlpha } from '@/lib/utils';

const statusTone: Record<ServiceStatus['status'], { label: string; className: string }> = {
  operational: { label: 'Operational', className: 'text-[#86efac]' },
  degraded: { label: 'Degraded', className: 'text-[#fcd34d]' },
  partial: { label: 'Partial outage', className: 'text-[#fda4af]' },
  down: { label: 'Down', className: 'text-[#fb7185]' },
  maintenance: { label: 'Maintenance', className: 'text-[#7dd3fc]' },
};

export function StatusLive({
  initialStatuses,
  initialLive,
  history,
}: {
  initialStatuses: ServiceStatus[];
  initialLive: LiveStats;
  history: { label: string; ok: boolean }[];
}) {
  const [statuses, setStatuses] = useState<ServiceStatus[]>(initialStatuses);
  const [live, setLive] = useState<LiveStats>(initialLive);
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel('status-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_status' }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const row = ((payload.new && Object.keys(payload.new).length ? payload.new : payload.old) ?? {}) as ServiceStatus;
        if (row?.id) {
          setStatuses((prev) => {
            const exists = prev.some((s) => s.id === row.id);
            const next = exists ? prev.map((s) => (s.id === row.id ? { ...s, ...row } : s)) : [...prev, row];
            return next.sort((a, b) => a.sort_order - b.sort_order);
          });
          setUpdatedAt(new Date().toISOString());
          setFlash(row.region ?? null);
          setTimeout(() => setFlash(null), 1800);
        }
      })
      .subscribe((status: string) => setConnected(status === 'SUBSCRIBED'));

    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (res.ok) setLive((await res.json()) as LiveStats);
      } catch {
        /* keep last known values */
      }
    }, 12000);

    return () => {
      sb.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const regions = statuses.filter((s) => s.region !== 'Global');
  const services = statuses.filter((s) => s.region === 'Global');
  const affected = statuses.filter((s) => s.status !== 'operational').length;
  const allOk = affected === 0;
  const headline = allOk ? 'All systems operational' : `${affected} component${affected === 1 ? '' : 's'} affected`;

  return (
    <div className="space-y-9">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'relative overflow-hidden rounded-2xl border p-6 sm:p-7',
          allOk ? 'border-[rgba(74,222,128,0.24)] bg-[rgba(74,222,128,0.06)]' : 'border-[rgba(251,191,36,0.26)] bg-[rgba(251,191,36,0.06)]',
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl"
          style={{ background: allOk ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.16)' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl border',
                allOk ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.12)]' : 'border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.12)]',
              )}
            >
              <IconActivity width={20} height={20} className={allOk ? 'text-[#86efac]' : 'text-[#fcd34d]'} />
            </span>
            <div>
              <h2 className={cn('text-[20px] font-semibold tracking-tight sm:text-[24px]', allOk ? 'text-[#b7f0cd]' : 'text-[#fde68a]')}>{headline}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[color:var(--text-dim)]">
                <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-[#4ade80]' : 'bg-[#fbbf24]')} />
                {connected ? 'Live — pushed from the control plane' : 'Connecting to realtime…'}
                <span className="text-[color:var(--text-faint)]">· updated {timeAgo(updatedAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Metric label="Uptime" value={`${live.uptime}%`} />
            <Metric label="Avg ping" value={`${live.avgLatency}ms`} />
            <Metric label="In game" value={live.playersOnline.toLocaleString()} />
          </div>
        </div>
      </motion.div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">Incident history</h3>
          {history.length > 0 ? (
            <span className="text-[11.5px] text-neutral-500">
              {history.filter((day) => day.ok).length}/{history.length} days fully operational
            </span>
          ) : null}
        </div>
        {history.length > 0 ? (
          <div className="flex gap-[3px] overflow-hidden rounded-lg">
            {history.map((day, i) => (
              <motion.span
                key={day.label}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.004, duration: 0.24 }}
                className={cn('h-9 flex-1 origin-bottom rounded-[2px]', day.ok ? 'bg-neutral-600' : 'bg-neutral-300')}
                title={`${day.label}: ${day.ok ? 'no incident recorded' : 'degradation recorded'}`}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-5 text-sm leading-6 text-neutral-400">
            Historical incident data is not available yet. This view will populate when incident events are recorded.
          </p>
        )}
      </section>

      <section id="regions" className="scroll-mt-24">
        <div className="mb-4 flex items-center gap-2.5">
          <IconServer width={16} height={16} className="text-brand-300" />
          <h3 className="text-[15px] font-semibold tracking-tight text-white">Cloud GPU regions</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {regions.map((r) => {
              const tone = statusTone[r.status] ?? statusTone.operational;
              return (
                <motion.div
                  key={r.id}
                  layout
                  animate={
                    flash === r.region
                      ? { boxShadow: ['0 0 0 0 rgba(109,92,255,0)', '0 0 0 4px rgba(109,92,255,0.35)', '0 0 0 0 rgba(109,92,255,0)'] }
                      : {}
                  }
                  transition={{ duration: 1.6 }}
                  className="card-hover rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                        <StatusDot status={r.status} />
                        {r.region}
                      </h4>
                      <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--text-faint)]">{r.region_code}</p>
                    </div>
                    <span className={cn('shrink-0 text-[11.5px] font-semibold capitalize', tone.className)}>{tone.label}</span>
                  </div>

                  <p className="mt-3 min-h-[34px] text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{r.message}</p>

                  <div className="mt-4 space-y-2.5">
                    <LoadBar label="Node load" value={r.load_percent} icon={<IconCpu width={12} height={12} />} />
                    <div className="flex items-center justify-between text-[11.5px] text-[color:var(--text-faint)]">
                      <span className="flex items-center gap-1.5">
                        <IconWifi width={12} height={12} /> {r.latency_ms} ms median
                      </span>
                      <span className="font-mono">{r.gpu_pool}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <IconRefresh width={16} height={16} className="text-brand-300" />
          <h3 className="text-[15px] font-semibold tracking-tight text-white">Platform services</h3>
        </div>
        <div className="panel divide-y divide-white/[0.05] overflow-hidden rounded-2xl">
          {services.map((s) => {
            const tone = statusTone[s.status] ?? statusTone.operational;
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <StatusDot status={s.status} />
                  <span className="shrink-0 text-[13.5px] font-medium text-white">{s.service}</span>
                  <span className="hidden truncate text-[11.5px] text-[color:var(--text-faint)] sm:inline">{s.message}</span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-mono text-[11.5px] tabular-nums text-white/60">{s.latency_ms} ms</span>
                  <span className={cn('text-[11.5px] font-semibold capitalize', tone.className)}>{tone.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">{label}</p>
      <p className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function LoadBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const tone = value > 85 ? '#fb7185' : value > 68 ? '#fbbf24' : '#4ade80';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-[color:var(--text-faint)]">
        <span className="flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span className="font-mono tabular-nums" style={{ color: withAlpha(tone, 1) }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
