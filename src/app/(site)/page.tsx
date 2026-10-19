import type { Metadata } from 'next';
import Link from 'next/link';
import { GameArt } from '@/components/art/GameArt';
import { IconArrowRight, IconPlay, IconWifi } from '@/components/ui/Icons';
import { getGames, getLiveStats, getServiceStatus, getSiteSettings } from '@/lib/queries';
import { formatNumber } from '@/lib/utils';

export const revalidate = 45;
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [settings, games, live, statuses] = await Promise.all([
    getSiteSettings(),
    getGames({ limit: 60 }),
    getLiveStats(),
    getServiceStatus(),
  ]);
  const published = games.filter((game) => game.published);
  const featured = published.filter((game) => game.featured).slice(0, 4);
  const popular = [...published].sort((a, b) => b.players_online - a.players_online).slice(0, 8);
  const readyRegions = new Set(statuses.filter((status) => status.status === 'operational').map((status) => status.region)).size;

  return (
    <div className="bg-[#080808] text-white">
      <section className="section grid min-h-[610px] items-center gap-12 pb-20 pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-28">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Cloud gaming, without the hardware
          </p>
          <h1 className="max-w-[780px] text-5xl font-bold leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-[78px]">
            Your games.<br /><span className="text-neutral-500">Your screen.</span><br />No limits.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-neutral-400 sm:text-lg">
            Jump into games from your browser. No installs, no giant downloads, no complicated setup. Just choose a title and play.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/games" className="btn-primary !rounded-md !px-5 !py-3.5"><IconPlay width={15} height={15} />Explore games</Link>
            <Link href="/status" className="btn-outline !rounded-md !px-5 !py-3.5">View platform status <IconArrowRight width={15} height={15} /></Link>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/10 py-5">
            <div className="pr-4"><p className="text-2xl font-bold tracking-tight tabular-nums">{formatNumber(live.playersOnline)}</p><p className="mt-1 text-xs text-neutral-500">Playing now</p></div>
            <div className="border-l border-white/10 px-4"><p className="text-2xl font-bold tracking-tight tabular-nums">{published.length}</p><p className="mt-1 text-xs text-neutral-500">In the library</p></div>
            <div className="border-l border-white/10 pl-4"><p className="text-2xl font-bold tracking-tight tabular-nums">{readyRegions}</p><p className="mt-1 text-xs text-neutral-500">Regions online</p></div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-3 -top-3 z-10 border border-white/20 bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-neutral-300">Featured collection</div>
          {featured[0] ? (
            <Link href={featured[0].play_mode === 'native' ? `/play/${featured[0].slug}` : `/games/${featured[0].slug}`} className="group block">
              <div className="relative aspect-[4/4.25] overflow-hidden border border-white/15 bg-[#141414]">
                <GameArt slug={featured[0].slug} title={featured[0].title} genre={featured[0].genre} accent="#777777" coverUrl={featured[0].cover_url} rounded={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-neutral-400">Editor’s pick</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{featured[0].title}</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-300">{featured[0].tagline || featured[0].description || 'Ready when you are.'}</p>
                  <span className="mt-5 inline-flex items-center gap-2 border border-white bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors group-hover:bg-neutral-200">View game <IconArrowRight width={15} height={15} /></span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-[4/4.25] items-end border border-white/15 bg-neutral-950 p-8"><div><p className="text-xs uppercase tracking-[.18em] text-neutral-500">Dash library</p><h2 className="mt-3 text-4xl font-bold">Find your next game.</h2><Link href="/games" className="btn-primary mt-5">Browse library</Link></div></div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="section flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center border border-white/15"><IconWifi width={16} height={16} /></span><div><p className="text-sm font-semibold">Platform overview</p><p className="text-xs text-neutral-500">Live service information</p></div></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400"><span>{readyRegions} regions reporting healthy</span><span>Average latency <strong className="font-semibold text-white">{live.avgLatency || '—'} ms</strong></span><Link href="/status" className="font-semibold text-white underline underline-offset-4">Full status ↗</Link></div>
        </div>
      </section>

      <section className="section py-20 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="kicker">Start here</p><h2 className="mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Featured games</h2><p className="mt-2 text-sm text-neutral-500">Hand-picked titles worth your time.</p></div>
          <Link href="/games" className="hidden items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white sm:inline-flex">All games <IconArrowRight width={16} height={16} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(featured.length ? featured : popular.slice(0, 4)).map((game) => (
            <Link key={game.id} href={game.play_mode === 'native' ? `/play/${game.slug}` : `/games/${game.slug}`} className="group border border-white/10 bg-[#0d0d0d] transition-colors hover:border-white/40">
              <div className="relative aspect-[1.18/1] overflow-hidden bg-neutral-900"><GameArt slug={game.slug} title={game.title} genre={game.genre} accent="#666666" coverUrl={game.cover_url} rounded={false} /><span className="absolute left-3 top-3 border border-white/20 bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-200">{game.genre}</span></div>
              <div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold tracking-tight">{game.title}</h3><span className="text-sm text-neutral-500 transition-transform group-hover:translate-x-1">↗</span></div><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-neutral-500">{game.tagline || game.description || 'Open the game page for details.'}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-neutral-500"><span>{formatNumber(game.players_online)} playing</span><span className="font-semibold text-neutral-200">{game.play_mode === 'native' ? 'Play now' : 'Game details'}</span></div></div>
            </Link>
          ))}
        </div>
        <div className="mt-5 sm:hidden"><Link href="/games" className="btn-outline w-full">Browse all games <IconArrowRight width={15} height={15} /></Link></div>
      </section>

      <section className="border-y border-white/10 bg-[#f4f4f4] text-black">
        <div className="section grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center md:py-16">
          <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">No setup required</p><h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-[-.04em] sm:text-4xl">Open the library. Pick a game. Get playing.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">Original browser games can launch directly. Cloud-streamed titles become available when a supported stream is configured.</p></div>
          <Link href="/games" className="inline-flex items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">Browse the library <IconArrowRight width={16} height={16} /></Link>
        </div>
      </section>

      <section className="section py-20 sm:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div><p className="kicker">Built for access</p><h2 className="mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Less waiting.<br />More playing.</h2></div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border-t border-white/20 pt-4"><p className="text-sm font-semibold">Browser-first</p><p className="mt-2 text-sm leading-6 text-neutral-500">No desktop client needed for games built to run in your browser.</p></div>
            <div className="border-t border-white/20 pt-4"><p className="text-sm font-semibold">One library</p><p className="mt-2 text-sm leading-6 text-neutral-500">Browse genres, check game details, and discover what's playable.</p></div>
            <div className="border-t border-white/20 pt-4"><p className="text-sm font-semibold">Track your progress</p><p className="mt-2 text-sm leading-6 text-neutral-500">Sign in to keep your profile, favourites, and supported game history together.</p></div>
            <div className="border-t border-white/20 pt-4"><p className="text-sm font-semibold">Clear service status</p><p className="mt-2 text-sm leading-6 text-neutral-500">Check region and service health before starting a session.</p></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="section flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold tracking-tight">{settings.site.name || 'Dash'}</p><p className="mt-1 text-xs text-neutral-500">Cloud gaming, made straightforward.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500"><Link href="/about" className="hover:text-white">About</Link><Link href="/pricing" className="hover:text-white">Pricing</Link><Link href="/support" className="hover:text-white">Support</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link></div><p className="text-xs text-neutral-600">© {new Date().getFullYear()} Dash Cloud</p></div>
      </footer>
    </div>
  );
}
