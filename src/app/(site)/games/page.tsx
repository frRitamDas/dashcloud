import type { Metadata } from 'next';
import Link from 'next/link';
import { LibraryExplorer } from '@/components/games/LibraryExplorer';
import { getGames, getGenres, getLiveStats, getSiteSettings } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Discover games',
  description: 'Explore the Dash Cloud game catalogue, filter by genre and play mode, and open supported titles in your browser.',
};

export default async function GamesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const genre = typeof sp.genre === 'string' ? sp.genre : undefined;
  const mode = sp.mode === 'native' || sp.mode === 'cloud' ? sp.mode : undefined;
  const sort = (['popular', 'rating', 'newest', 'az'].includes(String(sp.sort)) ? String(sp.sort) : 'popular') as 'popular' | 'rating' | 'newest' | 'az';

  const [games, genres, live, settings] = await Promise.all([
    getGames({ search: q, genre, playMode: mode, sort, limit: 60 }),
    getGenres(),
    getLiveStats(),
    getSiteSettings(),
  ]);

  const instant = games.filter((game) => game.play_mode === 'native').length;

  return (
    <div className="page-shell">
      <header className="mb-8 border-b border-white/15 pb-8 sm:mb-10 sm:pb-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">
          <span>Dash Cloud / Catalogue</span>
          <Link href="/status" className="text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-colors hover:text-white">Check service status</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[.92] tracking-[-.075em]">Find your<br className="hidden sm:block" /> next game.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400 sm:text-base">One catalogue. Clear play options. Search for a title, choose a genre, and open a game when you are ready.</p>
          </div>
          <div className="grid grid-cols-3 border-y border-white/15 py-4 lg:min-w-[340px]">
            <div className="pr-3"><p className="text-xl font-bold tabular-nums">{settings.stats.gamesHosted}</p><p className="mt-1 text-[10px] text-neutral-500">Catalogue</p></div>
            <div className="border-l border-white/15 px-3"><p className="text-xl font-bold tabular-nums">{instant}</p><p className="mt-1 text-[10px] text-neutral-500">Instant play</p></div>
            <div className="border-l border-white/15 pl-3"><p className="text-xl font-bold tabular-nums">{formatNumber(live.playersOnline)}</p><p className="mt-1 text-[10px] text-neutral-500">Playing now</p></div>
          </div>
        </div>
      </header>
      <LibraryExplorer initialGames={games} genres={genres} />
    </div>
  );
}
