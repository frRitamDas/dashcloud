import type { Metadata } from 'next';
import Link from 'next/link';
import { LibraryExplorer } from '@/components/games/LibraryExplorer';
import { getGames, getGenres, getLiveStats, getSiteSettings } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Explore games — Dash Cloud',
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
    <div className="dc-catalogue">
      <header className="dc-catalogue__hero">
        <div className="dc-catalogue__breadcrumb"><span>DASH CLOUD</span><span>/</span><span>THE LIBRARY</span><Link href="/status">PLATFORM STATUS <span>↗</span></Link></div>
        <div className="dc-catalogue__headline">
          <div><p className="dc-eyebrow">PICK YOUR NEXT SESSION</p><h1>Find something<br /><span>worth playing.</span></h1></div>
          <p className="dc-catalogue__intro">A library without the maze. Search for a game, narrow your choices, and see the play options before you commit.</p>
        </div>
        <div className="dc-catalogue__stats">
          <div><strong>{settings.stats.gamesHosted.toString().padStart(2, '0')}</strong><span>CATALOGUE TITLES</span></div>
          <div><strong>{instant.toString().padStart(2, '0')}</strong><span>INSTANT PLAY</span></div>
          <div><strong>{formatNumber(live.playersOnline)}</strong><span>PLAYERS ONLINE</span></div>
          <div><strong>{genres.length.toString().padStart(2, '0')}</strong><span>GENRES</span></div>
        </div>
      </header>
      <div className="dc-catalogue__controls">
        <div><span>01</span><strong>Explore the collection</strong><p>Use search and filters to find the right fit.</p></div>
        <Link href="/games?mode=native">Browse instant-play games <span>↗</span></Link>
      </div>
      <div className="dc-catalogue__explorer"><LibraryExplorer initialGames={games} genres={genres} /></div>
    </div>
  );
}
