'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import type { LiveStats } from '@/lib/supabase/types';

export function LivePill({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as LiveStats;
        if (alive) setStats(data);
      } catch {
        /* offline is fine — the pill just stops updating */
      }
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const online = stats?.playersOnline ?? 0;

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 py-1.5"
      title={`${online.toLocaleString()} players online · ${stats?.activeSessions ?? 0} active cloud sessions`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
      </span>
      <motion.span
        key={online}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-mono text-[11.5px] font-semibold tabular-nums text-white/85"
      >
        {online ? formatNumber(online) : '—'}
      </motion.span>
      {!compact && <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-faint)]">online</span>}
    </div>
  );
}
