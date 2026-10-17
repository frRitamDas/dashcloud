'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import type { AdminSessionRow } from './types';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { IconChart, IconRefresh } from '@/components/ui/Icons';
import { cn, formatDuration, timeAgo } from '@/lib/utils';

export function SessionsPanel() {
  const { push } = useToast();
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ sessions: AdminSessionRow[]; total: number }>('/api/admin/sessions', { query: { active: activeOnly ? 1 : undefined, limit: 120 } });
      setSessions(data.sessions);
      setTotal(data.total);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeOnly, push]);

  useEffect(() => {
    load();
  }, [load]);

  const streaming = sessions.filter((s) => s.status === 'streaming').length;
  const failed = sessions.filter((s) => s.status === 'failed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2.5 text-[12.5px] text-[color:var(--text-dim)]">
          <Switch checked={activeOnly} onChange={setActiveOnly} label="Active only" /> Active sessions only
        </label>
        <button onClick={load} className="btn-ghost !py-2 !text-[12px]">
          <IconRefresh width={14} height={14} /> Refresh
        </button>
        <span className="ml-auto text-[12px] text-[color:var(--text-faint)]">
          {total.toLocaleString()} sessions recorded · {streaming} streaming · {failed} failed
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022]">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_repeat(4,minmax(0,0.8fr))] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] lg:grid">
          <span>Title</span>
          <span>Player</span>
          <span>Region</span>
          <span>Stream</span>
          <span>Duration</span>
          <span>Started</span>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-[12.5px] text-[color:var(--text-faint)]">
            <Spinner size={15} /> Loading sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <IconChart width={22} height={22} className="text-[color:var(--text-faint)]" />
            </span>
            <h3 className="text-[16px] font-semibold text-white">No sessions {activeOnly ? 'active right now' : 'recorded yet'}</h3>
            <p className="mt-1.5 text-[13px] text-[color:var(--text-dim)]">Sessions are created when a player launches a game and closed when they leave.</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3 last:border-0',
                'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_repeat(4,minmax(0,0.8fr))]',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    s.status === 'streaming' ? 'animate-pulse-soft bg-[#4ade80]' : s.status === 'booting' ? 'bg-[#fbbf24]' : s.status === 'failed' ? 'bg-[#fb7185]' : 'bg-[#475569]',
                  )}
                />
                <span className="truncate text-[13px] font-semibold text-white">{s.games?.title ?? 'Unknown title'}</span>
              </div>
              <span className="truncate text-[12px] text-[color:var(--text-dim)]">{s.profiles?.display_name || s.profiles?.username || (s.guest_id ? `guest ${s.guest_id.slice(0, 6)}` : 'guest')}</span>
              <span className="hidden font-mono text-[11.5px] text-[color:var(--text-faint)] lg:block">{s.region ?? 'auto'}</span>
              <span className="hidden lg:block">
                <span className="font-mono text-[11.5px] text-white/70">{s.resolution ?? '—'}</span>
                {typeof s.latency_ms === 'number' && (
                  <span className={cn('ml-2 font-mono text-[11px]', s.latency_ms > 60 ? 'text-[#fcd34d]' : 'text-neon-mint')}>{s.latency_ms}ms</span>
                )}
              </span>
              <span className="hidden font-mono text-[12px] tabular-nums text-white/75 lg:block">{s.duration_seconds ? formatDuration(s.duration_seconds) : '—'}</span>
              <span className="flex items-center justify-end gap-2 lg:justify-start">
                <Badge tone={s.status === 'streaming' ? 'mint' : s.status === 'booting' ? 'amber' : s.status === 'failed' ? 'rose' : 'neutral'}>{s.status}</Badge>
                <span className="hidden text-[11px] text-[color:var(--text-faint)] lg:inline">{timeAgo(s.started_at)}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
