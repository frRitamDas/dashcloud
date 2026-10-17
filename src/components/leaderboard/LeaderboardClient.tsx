'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { Game, ScoreRow } from '@/lib/supabase/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';
import { GameArt } from '@/components/art/GameArt';
import { Tabs } from '@/components/ui/Tabs';
import { IconSparkles, IconTrophy } from '@/components/ui/Icons';
import { cn, initials, timeAgo, withAlpha } from '@/lib/utils';

type Row = ScoreRow & { _fresh?: boolean };

export function LeaderboardClient({
  games,
  initial,
}: {
  games: Game[];
  initial: Record<string, Row[]>;
}) {
  const [active, setActive] = useState<string>(games[0]?.slug ?? 'global');
  const [boards, setBoards] = useState<Record<string, Row[]>>(initial);

  const activeGame = useMemo(() => games.find((g) => g.slug === active), [games, active]);

  useEffect(() => {
    const sb = supabaseBrowser();
    const ids = games.map((g) => g.id);
    const channel = sb
      .channel('leaderboard-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scores', filter: `game_id=in.(${ids.join(',')})` },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as { game_id: string };
          if (!row?.game_id) return;
          const game = games.find((g) => g.id === row.game_id);
          if (!game) return;
          const { data } = await sb
            .from('scores')
            .select('id,user_id,guest_name,game_id,score,metric,payload,created_at,profiles(username,display_name,avatar_url,level)')
            .eq('game_id', game.id)
            .order('score', { ascending: false })
            .limit(25);
          setBoards((prev) => ({ ...prev, [game.slug]: (data ?? []) as unknown as Row[] }));
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [games]);

  const rows = boards[active] ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs
          items={games.map((g) => ({ id: g.slug, label: g.title }))}
          value={active}
          onChange={setActive}
          className="max-w-full"
        />
        {activeGame && (
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.022] px-3 py-2">
            <span className="h-8 w-6 overflow-hidden rounded">
              <GameArt slug={activeGame.slug} title={activeGame.title} genre={activeGame.genre} accent={activeGame.accent} coverUrl={activeGame.cover_url} rounded={false} />
            </span>
            <span>
              <span className="block text-[12.5px] font-semibold text-white">{activeGame.title}</span>
              <span className="block text-[11px] text-[color:var(--text-faint)]">
                metric: {activeGame.engine_key ? rows[0]?.metric ?? 'points' : 'points'} · weekly reset
              </span>
            </span>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <IconTrophy width={22} height={22} className="text-[color:var(--text-faint)]" />
          </span>
          <h3 className="text-[16px] font-semibold text-white">No scores on this board yet</h3>
          <p className="mt-1.5 max-w-sm text-[13px] text-[color:var(--text-dim)]">
            Be the first to set a time. Launch {activeGame?.title ?? 'the game'} and your run lands here the moment it ends.
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[64px_1fr_120px_110px] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] sm:grid">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right">Set</span>
          </div>

          <AnimatePresence initial={false}>
            {rows.map((row, i) => {
              const name = row.profiles?.display_name || row.profiles?.username || row.guest_name || 'Anonymous';
              const medal = i === 0 ? { c: '#fbbf24', label: 'Gold' } : i === 1 ? { c: '#cbd5e1', label: 'Silver' } : i === 2 ? { c: '#d9915b', label: 'Bronze' } : null;
              return (
                <motion.div
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(109,92,255,0.16)' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(109,92,255,0)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-[46px_1fr_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3.5 last:border-0 sm:grid-cols-[64px_1fr_120px_110px]"
                >
                  <span className="flex items-center gap-2">
                    {medal ? (
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-black"
                        style={{ background: medal.c, boxShadow: `0 6px 18px -8px ${withAlpha(medal.c, 0.9)}` }}
                      >
                        {i + 1}
                      </span>
                    ) : (
                      <span className="w-7 text-center font-mono text-[12.5px] font-bold tabular-nums text-white/30">{String(i + 1).padStart(2, '0')}</span>
                    )}
                    {i === 0 && <IconSparkles width={13} height={13} className="hidden text-[#fbbf24] sm:block" />}
                  </span>

                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${activeGame?.accent ?? '#6d5cff'}, ${withAlpha(activeGame?.accent ?? '#6d5cff', 0.5)})` }}
                    >
                      {initials(name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold text-white">{name}</span>
                      <span className="block text-[11px] text-[color:var(--text-faint)]">
                        {row.profiles?.level ? `Level ${row.profiles.level}` : 'Guest run'}
                        {row.payload && Object.keys(row.payload).length > 0 && ` · ${Object.entries(row.payload).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(' · ')}`}
                      </span>
                    </span>
                  </span>

                  <span className={cn('text-right font-mono text-[15px] font-bold tabular-nums sm:text-[16px]', medal ? '' : 'text-white/85')} style={medal ? { color: medal.c } : undefined}>
                    {row.score.toLocaleString()}
                  </span>
                  <span className="hidden text-right text-[11.5px] text-[color:var(--text-faint)] sm:block">{timeAgo(row.created_at)}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
