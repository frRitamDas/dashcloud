'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import type { ActivityRow } from './types';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconActivity, IconRefresh, IconSearch } from '@/components/ui/Icons';
import { cn, timeAgo } from '@/lib/utils';

const toneFor = (action: string) => {
  if (action.includes('failed') || action.includes('deleted') || action.includes('banned')) return '#fb7185';
  if (action.includes('created') || action.includes('success')) return '#4ade80';
  if (action.includes('updated') || action.includes('changed')) return '#fbbf24';
  return '#9ba3ff';
};

export function ActivityPanel({ initial }: { initial: ActivityRow[] }) {
  const { push } = useToast();
  const [rows, setRows] = useState<ActivityRow[]>(initial);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ activity: ActivityRow[] }>('/api/admin/log', { query: { limit: 200 } });
      setRows(data.activity);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load the audit log', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const actors = Array.from(new Set(rows.map((r) => r.actor ?? 'system')));
  const visible = rows
    .filter((r) => (actor === 'all' ? true : (r.actor ?? 'system') === actor))
    .filter((r) => (q ? `${r.action} ${r.entity ?? ''} ${r.actor ?? ''}`.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input !pl-10 !py-2.5 !text-[13px]" placeholder="Filter actions, entities, actors…" />
        </div>
        <select value={actor} onChange={(e) => setActor(e.target.value)} className="input !w-auto !py-2.5 !text-[13px]">
          <option value="all">All actors</option>
          {actors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button onClick={load} className="btn-ghost !py-2 !text-[12px]">
          {loading ? <Spinner size={14} /> : <IconRefresh width={14} height={14} />} Refresh
        </button>
        <span className="text-[12px] text-[color:var(--text-faint)]">{visible.length} entries</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022]">
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3">
          <IconActivity width={15} height={15} className="text-brand-300" />
          <h2 className="text-[13.5px] font-semibold tracking-tight text-white">Audit log</h2>
          <span className="ml-auto text-[11px] text-[color:var(--text-faint)]">every privileged write is recorded here</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-5 py-14 text-center text-[12.5px] text-[color:var(--text-faint)]">No matching entries.</p>
        ) : (
          <div className="max-h-[62vh] divide-y divide-white/[0.045] overflow-y-auto">
            {visible.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.008, 0.25), duration: 0.25 }}
                className="flex items-start gap-3 px-5 py-3"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: toneFor(r.action) }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px] text-white/85">{r.action}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[color:var(--text-faint)]">
                    {r.actor ?? 'system'}
                    {r.entity ? ` · ${r.entity}${r.entity_id ? ` ${String(r.entity_id).slice(0, 8)}` : ''}` : ''}
                  </p>
                  {r.meta && Object.keys(r.meta).length > 0 && (
                    <pre className={cn('mt-1.5 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/35 px-2.5 py-1.5 font-mono text-[10.5px] leading-relaxed text-white/50')}>
                      {JSON.stringify(r.meta, null, 0).slice(0, 240)}
                    </pre>
                  )}
                </div>
                <span className="shrink-0 text-[10.5px] text-[color:var(--text-faint)]">{timeAgo(r.created_at)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
