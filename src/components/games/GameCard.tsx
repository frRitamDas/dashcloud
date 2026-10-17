'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { GameArt } from '@/components/art/GameArt';
import { IconHeart, IconPlay, IconStar, IconUsers } from '@/components/ui/Icons';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/Toast';
import { cn, formatNumber, withAlpha } from '@/lib/utils';

const statusMeta: Record<Game['status'], { label: string; className: string }> = {
  live: { label: 'Live', className: 'border-[rgba(74,222,128,0.32)] bg-[rgba(74,222,128,0.14)] text-[#86efac]' },
  queue: { label: 'Cloud queue', className: 'border-[rgba(251,191,36,0.32)] bg-[rgba(251,191,36,0.14)] text-[#fcd34d]' },
  maintenance: { label: 'Maintenance', className: 'border-[rgba(56,189,248,0.32)] bg-[rgba(56,189,248,0.14)] text-[#7dd3fc]' },
  soon: { label: 'Coming soon', className: 'border-white/15 bg-white/[0.08] text-white/70' },
};

export function GameCard({ game, priority = false, index = 0 }: { game: Game; priority?: boolean; index?: number }) {
  const router = useRouter();
  const { user } = useUser();
  const { push } = useToast();
  const [faved, setFaved] = useState(false);
  const [loadedFav, setLoadedFav] = useState(false);
  const status = statusMeta[game.status] ?? statusMeta.live;

  async function loadFav() {
    if (loadedFav || !user) return;
    setLoadedFav(true);
    const { data } = await supabaseBrowser().from('favorites').select('game_id').eq('user_id', user.id).eq('game_id', game.id).maybeSingle();
    setFaved(Boolean(data));
  }

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      push('Sign in to build your library of favourites.', 'info');
      router.push('/login');
      return;
    }
    const sb = supabaseBrowser();
    if (faved) {
      await sb.from('favorites').delete().eq('user_id', user.id).eq('game_id', game.id);
      setFaved(false);
      push(`Removed ${game.title} from favourites`, 'info');
    } else {
      await sb.from('favorites').insert({ user_id: user.id, game_id: game.id });
      setFaved(true);
      push(`Saved ${game.title} to your library`, 'success');
    }
  }

  const playable = game.status !== 'soon' && game.status !== 'maintenance';

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.35), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
      onMouseEnter={loadFav}
    >
      <Link href={`/games/${game.slug}`} className="block focus:outline-none">
        <div className="card-hover relative overflow-hidden rounded-xl2 border border-white/[0.07] bg-[#0a0c14]">
          <div className="relative aspect-[3/4] overflow-hidden">
            <div className="absolute inset-0 transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
              <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/25 to-transparent" />

            <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
              <span className={cn('rounded-full border px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.12em] backdrop-blur-md', status.className)}>
                {status.label}
              </span>
              {game.play_mode === 'native' && (
                <span className="rounded-full border border-white/15 bg-black/45 px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur-md">
                  Instant play
                </span>
              )}
            </div>

            <button
              onClick={toggleFav}
              aria-label={faved ? 'Remove from favourites' : 'Add to favourites'}
              className={cn(
                'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200',
                faved ? 'border-[rgba(251,113,133,0.5)] bg-[rgba(251,113,133,0.18)] text-[#fda4af]' : 'border-white/12 bg-black/40 text-white/60 hover:text-white',
                'opacity-0 group-hover:opacity-100 focus:opacity-100',
                faved && 'opacity-100',
              )}
            >
              <IconHeart width={15} height={15} className={faved ? 'fill-current' : ''} />
            </button>

            {priority && (
              <span className="absolute right-2.5 top-12 rounded-lg border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.14)] px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#fcd34d] backdrop-blur-md">
                Featured
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-white">{game.title}</h3>
              <p className="mt-0.5 truncate text-[11.5px] text-white/50">{game.tagline}</p>
              <div className="mt-2.5 flex items-center gap-3 text-[11px] text-white/55">
                <span className="flex items-center gap-1">
                  <IconStar width={11} height={11} className="text-[#fbbf24]" />
                  <span className="font-mono tabular-nums">{game.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <IconUsers width={11} height={11} />
                  <span className="font-mono tabular-nums">{formatNumber(game.players_online)}</span>
                </span>
                <span className="ml-auto rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-white/55">
                  {game.genre}
                </span>
              </div>
            </div>

            {/* hover play affordance */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
                style={{ background: withAlpha(game.accent, 0.34), boxShadow: `0 16px 40px -14px ${withAlpha(game.accent, 0.9)}` }}
              >
                <IconPlay width={20} height={20} className="ml-0.5 text-white" />
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-xl2 ring-1 ring-inset ring-white/[0.06]" />
          </div>
        </div>
      </Link>

      {playable && (
        <Link
          href={`/play/${game.slug}`}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[12.5px] font-semibold text-white/80 opacity-0 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus:opacity-100 group-hover:opacity-100"
        >
          <IconPlay width={13} height={13} />
          {game.play_mode === 'native' ? 'Play instantly' : 'Launch cloud session'}
        </Link>
      )}
    </motion.article>
  );
}

export function GameRow({ game, rank }: { game: Game; rank?: number }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045]"
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 text-center font-mono text-[15px] font-bold tabular-nums text-white/25 group-hover:text-white/55">{rank}</span>
      )}
      <span className="h-12 w-9 shrink-0 overflow-hidden rounded-md">
        <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-white">{game.title}</span>
        <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">
          {game.genre} · {game.play_mode === 'native' ? 'instant play' : `cloud ${game.cloud_tier}`}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-[11.5px] text-white/55 sm:flex">
        <IconUsers width={12} height={12} />
        <span className="font-mono tabular-nums">{formatNumber(game.players_online)}</span>
      </span>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-60 transition-all duration-200 group-hover:opacity-100"
        style={{ background: withAlpha(game.accent, 0.16), color: game.accent }}
      >
        <IconPlay width={13} height={13} />
      </span>
    </Link>
  );
}
