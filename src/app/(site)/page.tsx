import type { Metadata } from 'next';
import Link from 'next/link';
import { GameArt } from '@/components/art/GameArt';
import { IconArrowRight, IconPlay, IconWifi } from '@/components/ui/Icons';
import { getGames, getLiveStats, getServiceStatus, getSiteSettings } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;
export const metadata: Metadata = {
  title: 'Play more. Install less.',
  description: 'Discover browser-native games and explore the Dash cloud gaming catalogue.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [settings, games, live, statuses] = await Promise.all([
    getSiteSettings(),
    getGames({ limit: 60 }),
    getLiveStats(),
    getServiceStatus(),
  ]);

  const published = games.filter((game) => game.published);
  const featured = published.filter((game) => game.featured).slice(0, 4);
  const popular = [...published]
    .sort((a, b) => b.players_online - a.players_online)
    .slice(0, 8);
  const picks = featured.length ? featured : popular.slice(0, 4);
  const readyRegions = new Set(
    statuses.filter((status) => status.status === 'operational').map((status) => status.region),
  ).size;
  const spotlight = picks[0];

  return (
    <div className="bg-[#080808] text-white">
      <section className="section grid min-h-[620px] items-center gap-10 pb-16 pt-20 sm:pt-24 lg:grid-cols-[1fr_.88fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Gaming, made more accessible
          </div>
          <h1 className="max-w-[760px] text-[clamp(3.25rem,7.4vw,6.7rem)] font-bold leading-[.91] tracking-[-.075em]">
            Play more.
            <br />
            <span className="text-neutral-500">Install less.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
            Your next game is a few clicks away. Explore the library, launch browser-native titles, and see what is available before you play.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/games" className="btn-primary !rounded-md !px-5 !py-3.5">
              <IconPlay width={15} height={15} />
              Explore the library
            </Link>
            <Link href="/status" className="btn-outline !rounded-md !px-5 !py-3.5">
              Platform status <IconArrowRight width={15} height={15} />
            </Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/10 py-5">
            <div className="pr-3 sm:pr-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatNumber(live.playersOnline)}</p>
              <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs">Playing now</p>
            </div>
            <div className="border-l border-white/10 px-3 sm:px-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{published.length}</p>
              <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs">Published games</p>
            </div>
            <div className="border-l border-white/10 pl-3 sm:pl-5">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{readyRegions}</p>
              <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs">Healthy regions</p>
            </div>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-neutral-500">
            <span>Spotlight / 01</span>
            <span>{spotlight ? spotlight.genre : 'Dash collection'}</span>
          </div>
          {spotlight ? (
            <Link
              href={spotlight.play_mode === 'native' ? `/play/${spotlight.slug}` : `/games/${spotlight.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/4.15] overflow-hidden border border-white/15 bg-[#111] sm:aspect-[4/3.8]">
                <GameArt
                  slug={spotlight.slug}
                  title={spotlight.title}
                  genre={spotlight.genre}
                  accent="#777777"
                  coverUrl={spotlight.cover_url}
                  rounded={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-neutral-400">Selected for you</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-.045em] sm:text-4xl">{spotlight.title}</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-300">
                    {spotlight.tagline || spotlight.description || 'Open the game page to see details and available play options.'}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors group-hover:bg-neutral-200">
                    {spotlight.play_mode === 'native' ? 'Play game' : 'Explore game'}
                    <IconArrowRight width={15} height={15} />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-[4/3.8] items-end border border-white/15 bg-[#101010] p-7">
              <div>
                <p className="text-[10px] uppercase tracking-[.18em] text-neutral-500">The Dash library</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight">Find your next game.</h2>
                <Link href="/games" className="btn-primary mt-5">Browse library</Link>
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-b border-white/10 pb-3 text-xs text-neutral-500">
            <span>Built for the browser</span>
            <span>Discover · Choose · Play</span>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="section flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-white/15"><IconWifi width={16} height={16} /></span>
            <div>
              <p className="text-sm font-semibold">Service at a glance</p>
              <p className="text-xs text-neutral-500">Live platform information</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-400">
            <span>{readyRegions} healthy regions</span>
            <span>Average latency <strong className="font-semibold text-white">{live.avgLatency || '—'} ms</strong></span>
            <Link href="/status" className="font-semibold text-white underline underline-offset-4">View status ↗</Link>
          </div>
        </div>
      </section>

      <section className="section py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="kicker">The collection</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.055em] sm:text-5xl">Worth a closer look.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500">A changing selection from the library. Open a title to see how it plays and what is available.</p>
          </div>
          <Link href="/games" className="hidden items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white sm:inline-flex">
            All games <IconArrowRight width={16} height={16} />
          </Link>
        </div>
        {picks.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {picks.map((game, index) => (
              <Link
                key={game.id}
                href={game.play_mode === 'native' ? `/play/${game.slug}` : `/games/${game.slug}`}
                className="group min-w-0 border border-white/10 bg-[#0d0d0d] transition-colors hover:border-white/40"
              >
                <div className="relative aspect-[1.08/1] overflow-hidden bg-neutral-900">
                  <GameArt slug={game.slug} title={game.title} genre={game.genre} accent="#666666" coverUrl={game.cover_url} rounded={false} />
                  <span className="absolute left-3 top-3 border border-white/20 bg-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-200">{game.genre}</span>
                  <span className="absolute right-3 top-3 font-mono text-[10px] text-white/60">0{index + 1}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight">{game.title}</h3>
                    <span className="text-sm text-neutral-500 transition-transform group-hover:translate-x-1">↗</span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-neutral-500">{game.tagline || game.description || 'Open the game page for more details.'}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-neutral-500">
                    <span>{formatNumber(game.players_online)} playing</span>
                    <span className="font-semibold text-neutral-200">{game.play_mode === 'native' ? 'Play now' : 'View details'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-white/10 bg-[#0d0d0d] p-8 sm:p-12">
            <p className="text-sm font-semibold">The library is getting ready.</p>
            <p className="mt-2 text-sm text-neutral-500">Check back soon, or view platform status for service updates.</p>
            <Link href="/status" className="btn-outline mt-5">View platform status</Link>
          </div>
        )}
        <div className="mt-5 sm:hidden"><Link href="/games" className="btn-outline w-full">Browse all games <IconArrowRight width={15} height={15} /></Link></div>
      </section>

      <section className="border-y border-white/10 bg-[#f4f4f4] text-black">
        <div className="section grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center md:py-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">Start with one click</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-[-.055em] sm:text-5xl">A library built around playing.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">Browser-native titles can launch directly. Cloud-streamed games require a supported, configured stream endpoint.</p>
          </div>
          <Link href="/games" className="inline-flex items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">
            Find a game <IconArrowRight width={16} height={16} />
          </Link>
        </div>
      </section>

      <section className="section py-16 sm:py-24">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-16">
          <div>
            <p className="kicker">The Dash approach</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-.055em] sm:text-5xl">Less friction.<br />More game time.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500">A straightforward place to discover supported games, keep track of your progress, and check service health.</p>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div className="border-t border-white/20 py-5">
              <p className="text-sm font-semibold">Browser-first</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Play games built for the browser without installing a desktop client.</p>
            </div>
            <div className="border-t border-white/20 py-5">
              <p className="text-sm font-semibold">One library</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Browse genres, search titles, and check supported play modes in one place.</p>
            </div>
            <div className="border-t border-white/20 py-5">
              <p className="text-sm font-semibold">Your progress</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Sign in to keep your profile, favourites, and supported game history together.</p>
            </div>
            <div className="border-t border-white/20 py-5">
              <p className="text-sm font-semibold">Honest availability</p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Check platform and region status before you start a session.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="section flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold tracking-tight">{settings.site.name || 'Dash'}</p>
            <p className="mt-1 text-xs text-neutral-500">Cloud gaming, made straightforward.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
          <p className="text-xs text-neutral-600">© {new Date().getFullYear()} Dash Cloud</p>
        </div>
      </footer>
    </div>
  );
}
