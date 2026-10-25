'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { GameArt } from '@/components/art/GameArt';
import { IconHeart, IconPlay, IconStar, IconUsers, IconArrowRight } from '@/components/ui/Icons';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/Toast';
import { cn, formatNumber } from '@/lib/utils';

const statusLabel: Record<Game['status'], string> = {
  live: 'Available',
  queue: 'Cloud queue',
  maintenance: 'Maintenance',
  soon: 'Coming soon',
};

export function GameCard({ game, priority = false }: { game: Game; priority?: boolean; index?: number }) {
  const router = useRouter();
  const { user } = useUser();
  const { push } = useToast();
  const [faved, setFaved] = useState(false);
  const [loadedFav, setLoadedFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState(false);
  const playable = game.status !== 'soon' && game.status !== 'maintenance';

  async function loadFav(): Promise<boolean | null> {
    if (loadedFav) return faved;
    if (!user) return null;
    try {
      const { data, error } = await supabaseBrowser()
        .from('favorites')
        .select('game_id')
        .eq('user_id', user.id)
        .eq('game_id', game.id)
        .maybeSingle();
      if (error) throw error;
      const exists = Boolean(data);
      setFaved(exists);
      setLoadedFav(true);
      setFavError(false);
      return exists;
    } catch {
      setFavError(true);
      return null;
    }
  }

  async function toggleFav(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      push('Sign in to save games to your library.', 'info');
      router.push('/login');
      return;
    }
    if (favBusy) return;
    setFavBusy(true);
    try {
      const currentFaved = loadedFav ? faved : await loadFav();
      if (currentFaved === null) {
        push('Could not check your saved games. Please try again.', 'error');
        return;
      }
      const db = supabaseBrowser();
      const result = currentFaved
        ? await db.from('favorites').delete().eq('user_id', user.id).eq('game_id', game.id)
        : await db.from('favorites').insert({ user_id: user.id, game_id: game.id });
      if (result.error) throw result.error;
      setFaved(!currentFaved);
      setLoadedFav(true);
      setFavError(false);
      push(currentFaved ? 'Removed from favourites.' : 'Saved to your favourites.', 'success');
    } catch {
      push('Your favourites could not be updated. Please try again.', 'error');
    } finally {
      setFavBusy(false);
    }
  }

  const status = statusLabel[game.status] ?? 'Availability unknown';

  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link href={`/games/${game.slug}`} className="block focus:outline-none" aria-label={`View ${game.title}`}>
          <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#111]">
            <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
            <span className="absolute left-2.5 top-2.5 bg-black px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white">{status}</span>
            {priority && <span className="absolute bottom-2.5 left-2.5 border border-white/30 bg-black/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white">Featured</span>}
          </div>
        </Link>
        <button
          type="button"
          onMouseEnter={loadFav}
          onFocus={loadFav}
          onClick={toggleFav}
          disabled={favBusy}
          aria-label={faved ? `Remove ${game.title} from favourites` : `Add ${game.title} to favourites`}
          aria-pressed={faved}
          title={favError ? 'Could not check saved state; try again' : faved ? 'Remove from favourites' : 'Add to favourites'}
          className={cn(
            'absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center border border-white/20 bg-black text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50',
            faved && 'bg-white text-black',
          )}
        >
          <IconHeart width={16} height={16} className={faved ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/games/${game.slug}`} className="block truncate text-sm font-bold tracking-tight text-white underline-offset-4 hover:underline">{game.title}</Link>
            <p className="mt-1 truncate text-xs text-neutral-500">{game.tagline || game.genre}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-400" title={`Rating ${game.rating.toFixed(1)}`}>
            <IconStar width={12} height={12} />
            <span className="font-mono tabular-nums">{game.rating.toFixed(1)}</span>
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5"><IconUsers width={12} height={12} />{formatNumber(game.players_online)} playing</span>
          <span>{game.play_mode === 'native' ? 'Browser game' : 'Cloud game'}</span>
        </div>
        {playable && (
          <Link href={`/play/${game.slug}`} className="mt-3 flex min-h-10 items-center justify-between border border-white/15 px-3 text-xs font-bold text-neutral-200 transition-colors hover:border-white hover:bg-white hover:text-black">
            {game.play_mode === 'native' ? 'Play instantly' : 'Open game'} <IconArrowRight width={14} height={14} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function GameRow({ game, rank }: { game: Game; rank?: number }) {
  return (
    <Link href={`/games/${game.slug}`} className="group flex min-w-0 items-center gap-3 border-b border-white/10 py-3 transition-colors hover:bg-white/[0.025]">
      {rank !== undefined && <span className="w-7 shrink-0 text-center font-mono text-sm tabular-nums text-neutral-600">{String(rank).padStart(2, '0')}</span>}
      <span className="h-12 w-16 shrink-0 overflow-hidden border border-white/10 bg-[#111]">
        <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{game.title}</span>
        <span className="mt-1 block truncate text-[11px] text-neutral-500">{game.genre} · {game.play_mode === 'native' ? 'Instant play' : `Cloud ${game.cloud_tier}`}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-neutral-500 sm:flex"><IconUsers width={12} height={12} />{formatNumber(game.players_online)}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/15 text-neutral-300 transition-colors group-hover:bg-white group-hover:text-black"><IconPlay width={13} height={13} /></span>
    </Link>
  );
}
