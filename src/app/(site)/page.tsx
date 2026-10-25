import type { Metadata } from 'next';
import Link from 'next/link';
import { GameArt } from '@/components/art/GameArt';
import { IconArrowRight, IconPlay } from '@/components/ui/Icons';
import { getGames, getLiveStats, getServiceStatus } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;

export const metadata: Metadata = {
  title: 'Dash Cloud — Games, without the extra steps',
  description: 'Find your next game. Browse the library, discover browser-ready titles and see what is available before you play.',
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
  const collection = (featured.length ? featured : [...published].sort((a, b) => b.players_online - a.players_online)).slice(0, 4);
  const popular = [...published].sort((a, b) => b.players_online - a.players_online).slice(0, 6);
  const spotlight = collection[0];
  const healthyRegions = new Set(statuses.filter((item) => item.status === 'operational').map((item) => item.region)).size;

  return (
    <div className="bg-[#080808] text-white">
      <section className="section grid gap-10 pb-14 pt-12 sm:gap-14 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.2em] text-neutral-400">
            <span className="h-px w-8 bg-white" />
            The browser gaming library
          </p>
          <h1 className="max-w-[760px] text-[clamp(3.5rem,8.5vw,7.8rem)] font-bold leading-[.86] tracking-[-.085em]">
            Your next
            <br />
            <span className="text-neutral-500">game is</span>
            <br />
            <span>right here.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
            Find something worth playing. Explore the catalogue, check how each title runs, and get straight to the game without the noise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/games" className="btn-primary !rounded-md !px-5 !py-3.5">
              Browse all games <IconArrowRight width={16} height={16} />
            </Link>
            <Link href="/games?mode=native" className="btn-outline !rounded-md !px-5 !py-3.5">
              <IconPlay width={14} height={14} /> Play instantly
            </Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/15 py-5">
            <div className="pr-3 sm:pr-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{published.length}</p>
              <p className="mt-1.5 text-[11px] text-neutral-500 sm:text-xs">Available titles</p>
            </div>
            <div className="border-l border-white/15 px-3 sm:px-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{formatNumber(live.playersOnline)}</p>
              <p className="mt-1.5 text-[11px] text-neutral-500 sm:text-xs">Playing now</p>
            </div>
            <div className="border-l border-white/15 pl-3 sm:pl-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{healthyRegions}</p>
              <p className="mt-1.5 text-[11px] text-neutral-500 sm:text-xs">Healthy regions</p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {spotlight ? (
            <Link href={spotlight.play_mode === 'native' ? `/play/${spotlight.slug}` : `/games/${spotlight.slug}`} className="group block">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">
                <span>Featured title</span>
                <span>01 / {String(collection.length).padStart(2, '0')}</span>
              </div>
              <div className="relative aspect-[4/4.2] overflow-hidden border border-white/15 bg-[#111] sm:aspect-[4/3.7]">
                <GameArt slug={spotlight.slug} title={spotlight.title} genre={spotlight.genre} accent="#777777" coverUrl={spotlight.cover_url} rounded={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-300">{spotlight.genre}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-.055em] sm:text-5xl">{spotlight.title}</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-300">{spotlight.tagline || spotlight.description || 'Open the title to see details and available play options.'}</p>
                  <span className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-bold text-black transition-colors group-hover:bg-neutral-200">
                    {spotlight.play_mode === 'native' ? 'Play now' : 'View game'} <IconArrowRight width={15} height={15} />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-[4/3.7] flex-col justify-end border border-white/15 bg-[#101010] p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">The collection</p>
              <h2 className="mt-3 max-w-md text-4xl font-bold tracking-[-.06em] sm:text-5xl">A good game is a good place to start.</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">The library is being prepared. Check back as new titles are published.</p>
              <Link href="/status" className="btn-outline mt-6 w-fit">Platform status <IconArrowRight width={15} height={15} /></Link>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-4 text-[11px] text-neutral-500">
            <span>Game artwork and availability depend on each title.</span>
            <Link href="/status" className="shrink-0 text-neutral-300 underline decoration-neutral-700 underline-offset-4 hover:text-white">Service status</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#f2f2f2] text-black">
        <div className="section grid gap-6 py-6 sm:grid-cols-3 sm:gap-8 sm:py-8">
          <div className="flex items-start gap-3">
            <span className="mt-1 font-mono text-xs text-neutral-500">01</span>
            <div><h2 className="text-sm font-bold">Find a title</h2><p className="mt-1 text-xs leading-5 text-neutral-600">Browse by name, genre and availability.</p></div>
          </div>
          <div className="flex items-start gap-3 border-t border-black/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <span className="mt-1 font-mono text-xs text-neutral-500">02</span>
            <div><h2 className="text-sm font-bold">Know before you play</h2><p className="mt-1 text-xs leading-5 text-neutral-600">See each game's supported play mode.</p></div>
          </div>
          <div className="flex items-start gap-3 border-t border-black/10 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <span className="mt-1 font-mono text-xs text-neutral-500">03</span>
            <div><h2 className="text-sm font-bold">Get into the game</h2><p className="mt-1 text-xs leading-5 text-neutral-600">Launch supported browser titles directly.</p></div>
          </div>
        </div>
      </section>

      <section className="section py-16 sm:py-24">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">Hand-picked</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.06em] sm:text-5xl">A place to start.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500">A short list of titles to help you find your next session.</p>
          </div>
          <Link href="/games" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-300 hover:text-white">Explore the library <IconArrowRight width={16} height={16} /></Link>
        </div>
        {collection.length ? (
          <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {collection.map((game, index) => (
              <Link key={game.id} href={game.play_mode === 'native' ? `/play/${game.slug}` : `/games/${game.slug}`} className="group min-w-0">
                <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#111]">
                  <GameArt slug={game.slug} title={game.title} genre={game.genre} accent="#666666" coverUrl={game.cover_url} rounded={false} />
                  <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{game.genre}</span>
                  <span className="absolute right-3 top-3 font-mono text-[10px] text-white/70">0{index + 1}</span>
                </div>
                <div className="flex items-start justify-between gap-3 pt-3">
                  <div className="min-w-0"><h3 className="truncate text-base font-bold tracking-tight group-hover:underline group-hover:underline-offset-4">{game.title}</h3><p className="mt-1 text-xs text-neutral-500">{formatNumber(game.players_online)} playing · {game.play_mode === 'native' ? 'Browser game' : 'Cloud title'}</p></div>
                  <IconArrowRight width={16} height={16} className="mt-1 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-white/15 p-8 sm:p-12">
            <h3 className="text-xl font-bold">New titles are on the way.</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">There are no published games to show right now. You can still check service status or return to the catalogue later.</p>
            <Link href="/status" className="btn-outline mt-5">Check service status</Link>
          </div>
        )}
      </section>

      <section className="border-y border-white/15">
        <div className="section grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">Built around the player</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-[-.06em] sm:text-5xl">Less hunting.<br />More playing.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
            <div className="border-t border-white/15 py-5"><h3 className="text-sm font-bold">Straightforward discovery</h3><p className="mt-2 text-sm leading-6 text-neutral-500">Search titles, narrow the library, and get a clear path to each game's page.</p></div>
            <div className="border-t border-white/15 py-5"><h3 className="text-sm font-bold">Honest play options</h3><p className="mt-2 text-sm leading-6 text-neutral-500">Browser-native games can launch directly. Cloud play depends on a configured streaming service.</p></div>
            <div className="border-t border-white/15 py-5"><h3 className="text-sm font-bold">Your account in one place</h3><p className="mt-2 text-sm leading-6 text-neutral-500">Sign in to access the profile and progress features supported by your account.</p></div>
            <div className="border-t border-white/15 py-5"><h3 className="text-sm font-bold">Service visibility</h3><p className="mt-2 text-sm leading-6 text-neutral-500">Check platform status before starting a session.</p></div>
          </div>
        </div>
      </section>

      <section className="section py-16 sm:py-24">
        <div className="flex flex-col gap-6 border border-white/15 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">Ready when you are</p><h2 className="mt-3 text-3xl font-bold tracking-[-.06em] sm:text-4xl">Find a game. Make it yours.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">Start with the catalogue and find a title that fits your session.</p></div>
          <Link href="/games" className="btn-primary shrink-0 !rounded-md !px-5 !py-3.5">Browse games <IconArrowRight width={16} height={16} /></Link>
        </div>
      </section>
    </div>
  );
}
