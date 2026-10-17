import type { Metadata } from 'next';
import { LibraryExplorer } from '@/components/games/LibraryExplorer';
import { getGames, getGenres, getLiveStats, getSiteSettings } from '@/lib/queries';
import { IconBolt, IconCloud, IconGamepad } from '@/components/ui/Icons';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Game library',
  description: 'Browse every title on Dash Cloud Gaming — instant-play browser engines and cloud-streamed AAA games, all with zero downloads.',
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

  const instant = games.filter((g) => g.play_mode === 'native').length;

  return (
    <div className="section py-10 lg:py-14">
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="kicker">Catalogue</span>
            <h1 className="h-display mt-2.5 text-[34px] leading-tight sm:text-[46px]">Game library</h1>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--text-dim)]">
              {settings.stats.gamesHosted} titles hosted on {settings.site.name} cloud nodes. Instant-play engines launch
              straight in your browser; cloud titles stream from a GPU node with your saves kept server-side.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-x-6 gap-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.022] px-5 py-4">
            <div>
              <dt className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                <IconGamepad width={12} height={12} /> Titles
              </dt>
              <dd className="mt-1 font-mono text-[19px] font-bold tabular-nums text-white">{settings.stats.gamesHosted}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                <IconBolt width={12} height={12} /> Instant
              </dt>
              <dd className="mt-1 font-mono text-[19px] font-bold tabular-nums text-[#86efac]">{instant}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                <IconCloud width={12} height={12} /> Playing
              </dt>
              <dd className="mt-1 font-mono text-[19px] font-bold tabular-nums text-white">{formatNumber(live.playersOnline)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <LibraryExplorer initialGames={games} genres={genres} />
    </div>
  );
}
