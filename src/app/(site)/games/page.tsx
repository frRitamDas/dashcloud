import type { Metadata } from 'next';
import { LibraryExplorer } from '@/components/games/LibraryExplorer';
import { getGames, getGenres, getLiveStats, getSiteSettings } from '@/lib/queries';
import { IconBolt, IconCloud, IconGamepad } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Game library',
  description: 'Browse the Dash catalogue, find a title by genre, and launch supported games directly in your browser.',
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
  const summary = (
    <dl className="grid grid-cols-3 gap-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 sm:gap-6 sm:px-5">
      <div>
        <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500"><IconGamepad width={12} height={12} /> Titles</dt>
        <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{settings.stats.gamesHosted}</dd>
      </div>
      <div>
        <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500"><IconBolt width={12} height={12} /> Instant</dt>
        <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{instant}</dd>
      </div>
      <div>
        <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500"><IconCloud width={12} height={12} /> Playing</dt>
        <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{formatNumber(live.playersOnline)}</dd>
      </div>
    </dl>
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Catalogue"
        title="Find your next game."
        description={`${settings.stats.gamesHosted} titles in the Dash catalogue. Search by name, narrow by genre, and jump straight into supported games.`}
        action={summary}
      />
      <LibraryExplorer initialGames={games} genres={genres} />
    </div>
  );
}
