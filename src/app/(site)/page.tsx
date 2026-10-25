import type { Metadata } from 'next';
import Link from 'next/link';
import { GameArt } from '@/components/art/GameArt';
import { IconArrowRight, IconPlay } from '@/components/ui/Icons';
import { getGames, getLiveStats, getServiceStatus } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Dash Cloud — Find your next game',
  description: 'A considered library of browser and cloud games. Discover a title, check how it plays, and jump in.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [games, live, statuses] = await Promise.all([
    getGames({ limit: 60 }),
    getLiveStats(),
    getServiceStatus(),
  ]);

  const published = games.filter((game) => game.published);
  const featured = published.filter((game) => game.featured);
  const ranked = [...published].sort((a, b) => b.players_online - a.players_online);
  const spotlight = featured[0] ?? ranked[0];
  const nextUp = ranked.filter((game) => game.id !== spotlight?.id).slice(0, 6);
  const healthyRegions = new Set(statuses.filter((item) => item.status === 'operational').map((item) => item.region)).size;
  const genres = [...new Set(published.map((game) => game.genre).filter(Boolean))].slice(0, 6);

  return (
    <div className="dc-home">
      <section className="dc-intro">
        <div className="dc-intro__copy">
          <p className="dc-eyebrow"><span className="dc-live-dot" /> A better way to play</p>
          <h1>Good games.<br /><span>Zero detours.</span></h1>
          <p className="dc-intro__description">A library built for the moment you want to play. Find something new, see what it needs, and get right to it.</p>
          <div className="dc-intro__actions">
            <Link href="/games" className="dc-button dc-button--light">Explore the library <IconArrowRight width={16} height={16} /></Link>
            <Link href="/games?mode=native" className="dc-button dc-button--quiet"><IconPlay width={15} height={15} /> Instant play</Link>
          </div>
          <div className="dc-metrics" aria-label="Platform overview">
            <div><strong>{published.length.toString().padStart(2, '0')}</strong><span>Available games</span></div>
            <div><strong>{formatNumber(live.playersOnline)}</strong><span>Players online</span></div>
            <div><strong>{healthyRegions.toString().padStart(2, '0')}</strong><span>Healthy regions</span></div>
          </div>
        </div>

        <div className="dc-feature">
          <div className="dc-feature__top"><span>EDITOR'S PICK</span><span>01 <i /> {String(published.length).padStart(2, '0')}</span></div>
          {spotlight ? (
            <Link href={spotlight.play_mode === 'native' ? `/play/${spotlight.slug}` : `/games/${spotlight.slug}`} className="dc-feature__art">
              <GameArt slug={spotlight.slug} title={spotlight.title} genre={spotlight.genre} accent="#555555" coverUrl={spotlight.cover_url} rounded={false} priority />
              <span className="dc-feature__shade" />
              <span className="dc-feature__details">
                <span className="dc-feature__genre">{spotlight.genre || 'FEATURED GAME'}</span>
                <strong>{spotlight.title}</strong>
                <span className="dc-feature__tagline">{spotlight.tagline || spotlight.description || 'Open the game page for details and play options.'}</span>
                <span className="dc-feature__cta">{spotlight.play_mode === 'native' ? 'Play this game' : 'Explore title'} <IconArrowRight width={16} height={16} /></span>
              </span>
            </Link>
          ) : (
            <div className="dc-feature__empty">
              <span className="dc-feature__genre">THE LIBRARY</span>
              <strong>Your next favourite<br />starts here.</strong>
              <p>New titles will appear here when they are published.</p>
              <Link href="/status" className="dc-button dc-button--light">Platform status <IconArrowRight width={15} height={15} /></Link>
            </div>
          )}
          <div className="dc-feature__foot"><span>Featured from the Dash library</span><Link href="/status">System status <IconArrowRight width={13} height={13} /></Link></div>
        </div>
      </section>

      <section className="dc-principles" aria-label="How Dash works">
        <div><span>01 / DISCOVER</span><strong>Find the right game.</strong><p>Browse a focused catalogue without digging through noise.</p></div>
        <div><span>02 / UNDERSTAND</span><strong>Know what to expect.</strong><p>Each title has a clear page and supported play mode.</p></div>
        <div><span>03 / PLAY</span><strong>Get to the good part.</strong><p>Launch supported browser games directly from the library.</p></div>
      </section>

      <section className="dc-library">
        <div className="dc-section-heading">
          <div><p className="dc-eyebrow">THE LIBRARY</p><h2>Worth your time.</h2><p>Popular picks from across the collection, ready for your next session.</p></div>
          <Link href="/games" className="dc-text-link">View all games <IconArrowRight width={16} height={16} /></Link>
        </div>

        {genres.length > 0 && <div className="dc-genre-list"><span>EXPLORE BY GENRE</span>{genres.map((genre) => <Link key={genre} href={`/games?genre=${encodeURIComponent(genre)}`}>{genre}<IconArrowRight width={12} height={12} /></Link>)}</div>}

        {nextUp.length > 0 ? (
          <div className="dc-game-grid">
            {nextUp.map((game, index) => (
              <Link key={game.id} href={game.play_mode === 'native' ? `/play/${game.slug}` : `/games/${game.slug}`} className="dc-game-card">
                <div className="dc-game-card__image">
                  <GameArt slug={game.slug} title={game.title} genre={game.genre} accent="#666666" coverUrl={game.cover_url} rounded={false} />
                  <span className="dc-game-card__number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="dc-game-card__mode">{game.play_mode === 'native' ? 'BROWSER' : 'CLOUD'}</span>
                </div>
                <div className="dc-game-card__meta"><span>{game.genre || 'GAME'}</span><span>{formatNumber(game.players_online)} playing</span></div>
                <div className="dc-game-card__title"><h3>{game.title}</h3><span><IconArrowRight width={17} height={17} /></span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dc-library-empty"><span>LIBRARY UPDATE</span><h3>The next session starts soon.</h3><p>There are no other published games to feature right now. Visit the catalogue again as new titles arrive.</p><Link href="/games" className="dc-button dc-button--light">Open catalogue <IconArrowRight width={15} height={15} /></Link></div>
        )}
      </section>

      <section className="dc-bottom">
        <div className="dc-bottom__index">DASH CLOUD <span>—</span> PLAY, SIMPLIFIED</div>
        <div className="dc-bottom__content"><h2>Make room<br />for one more game.</h2><div><p>Start with the library. Find something that fits the moment. The rest should be easy.</p><Link href="/games" className="dc-button dc-button--light">Find your next game <IconArrowRight width={16} height={16} /></Link></div></div>
        <div className="dc-bottom__foot"><span>Discover something good.</span><Link href="/support">Need help? <IconArrowRight width={13} height={13} /></Link></div>
      </section>
    </div>
  );
}
