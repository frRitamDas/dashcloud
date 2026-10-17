'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Game } from '@/lib/supabase/types';
import { formatNumber, withAlpha } from '@/lib/utils';

export function LiveMarquee({ games }: { games: Game[] }) {
  const items = [...games, ...games];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-3.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#05060a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#05060a] to-transparent" />
      <motion.div
        className="flex w-max items-center gap-8"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((g, i) => (
          <Link key={`${g.id}-${i}`} href={`/games/${g.slug}`} className="group flex shrink-0 items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.accent, boxShadow: `0 0 8px ${withAlpha(g.accent, 0.85)}` }} />
            <span className="whitespace-nowrap text-[12.5px] font-semibold text-white/55 transition-colors group-hover:text-white">{g.title}</span>
            <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[color:var(--text-faint)]">
              {formatNumber(g.players_online)} playing
            </span>
            <span className="text-white/12">/</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
