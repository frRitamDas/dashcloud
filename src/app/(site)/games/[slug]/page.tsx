import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GameArt, GameBanner } from '@/components/art/GameArt';
import { GameRow } from '@/components/games/GameCard';
import { GameActions } from '@/components/games/GameActions';
import { getGameBySlug, getGames, getLeaderboard, getSiteSettings } from '@/lib/queries';
import { Reveal } from '@/components/ui/Reveal';
import { StatusDot } from '@/components/ui/Badge';
import {
  IconBolt,
  IconCheck,
  IconCloud,
  IconCpu,
  IconGauge,
  IconGamepad,
  IconMonitor,
  IconPlay,
  IconServer,
  IconStar,
  IconTrophy,
  IconUsers,
  IconWifi,
} from '@/components/ui/Icons';
import { formatNumber, initials, timeAgo, withAlpha } from '@/lib/utils';

export const revalidate = 45;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: 'Game not found' };
  return {
    title: `${game.title} — play on Dash`,
    description: game.tagline ?? game.description ?? `Stream ${game.title} free in your browser with Dash Cloud Gaming.`,
    openGraph: {
      title: `${game.title} on Dash Cloud Gaming`,
      description: game.tagline ?? undefined,
      images: game.cover_url ? [{ url: game.cover_url }] : undefined,
    },
  };
}

const statusCopy: Record<string, { label: string; copy: string }> = {
  live: { label: 'Live now', copy: 'Nodes are healthy — launch instantly.' },
  queue: { label: 'Cloud queue', copy: 'Short queue expected at peak hours.' },
  maintenance: { label: 'Maintenance', copy: 'This title is temporarily offline.' },
  soon: { label: 'Coming soon', copy: 'Provisioning is not open yet.' },
};

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const [game, allGames, board, settings] = await Promise.all([getGameBySlug(slug), getGames({ limit: 60 }), getLeaderboard(slug, 8), getSiteSettings()]);
  if (!game) notFound();

  const similar = allGames.filter((g) => g.id !== game.id && (g.genre === game.genre || g.tags?.some((t) => game.tags?.includes(t)))).slice(0, 6);
  const more = allGames.filter((g) => g.id !== game.id && !similar.some((s) => s.id === g.id)).slice(0, 4);
  const status = statusCopy[game.status] ?? statusCopy.live;
  const playable = game.status !== 'soon' && game.status !== 'maintenance';

  return (
    <article>
      {/* ---------- banner ---------- */}
      <header className="relative">
        <div className="absolute inset-0">
          <GameBanner slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} bannerUrl={game.banner_url} />
        </div>
        <div className="section relative pt-10 pb-10 lg:pt-16 lg:pb-14">
          <nav className="mb-8 flex items-center gap-2 text-[12px] text-white/45">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/games" className="transition-colors hover:text-white">Games</Link>
            <span>/</span>
            <Link href={`/games?genre=${encodeURIComponent(game.genre)}`} className="capitalize transition-colors hover:text-white">{game.genre.replace('-', ' ')}</Link>
            <span>/</span>
            <span className="truncate text-white/80">{game.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] backdrop-blur-md"
                  style={{ borderColor: withAlpha(game.accent, 0.4), background: withAlpha(game.accent, 0.16), color: game.accent }}
                >
                  {game.play_mode === 'native' ? 'Instant play' : `Cloud ${game.cloud_tier}`}
                </span>
                <span className="flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-md">
                  <StatusDot status={game.status} /> {status.label}
                </span>
                <span className="rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/60 backdrop-blur-md capitalize">
                  {game.genre.replace('-', ' ')}
                </span>
                {game.featured && (
                  <span className="rounded-full border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.14)] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#fcd34d] backdrop-blur-md">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="h-display mt-4 text-[38px] leading-[1.05] sm:text-[54px]">{game.title}</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-[16.5px]">{game.tagline}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-white/60">
                <span className="flex items-center gap-1.5">
                  <IconStar width={14} height={14} className="text-[#fbbf24]" />
                  <span className="font-mono font-bold tabular-nums text-white">{game.rating.toFixed(1)}</span> rating
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUsers width={14} height={14} />
                  <span className="font-mono font-bold tabular-nums text-white">{formatNumber(game.players_online)}</span> playing now
                </span>
                {game.publisher && (
                  <span className="flex items-center gap-1.5">
                    <IconGamepad width={14} height={14} /> {game.publisher}
                  </span>
                )}
                {game.release_year && (
                  <span className="flex items-center gap-1.5">
                    <IconTrophy width={14} height={14} /> {game.release_year}
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {playable ? (
                  <Link
                    href={`/play/${game.slug}`}
                    className="btn-primary !px-6 !py-3.5 !text-[15px] !rounded-2xl"
                    style={{ background: `linear-gradient(180deg, ${game.accent} 0%, ${game.accent}bb 100%)`, color: '#06070b' }}
                  >
                    <IconPlay width={17} height={17} />
                    {game.play_mode === 'native' ? 'Play instantly — free' : 'Launch cloud session'}
                  </Link>
                ) : (
                  <span className="btn-ghost !px-6 !py-3.5 !text-[15px] !rounded-2xl cursor-not-allowed">
                    <IconCheck width={16} height={16} /> {status.label}
                  </span>
                )}
                <GameActions game={game} />
              </div>

              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/45">
                <span className="flex items-center gap-1.5">
                  <IconBolt width={12} height={12} /> ~9s average boot
                </span>
                <span className="flex items-center gap-1.5">
                  <IconWifi width={12} height={12} /> {settings.streaming.transport ?? 'WebRTC'} · {settings.streaming.codec ?? 'AV1 / H.264'}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconMonitor width={12} height={12} /> Keyboard, mouse, touch & gamepad
                </span>
              </p>
            </div>

            {/* poster + quick facts */}
            <Reveal className="lg:justify-self-end">
              <div className="w-full max-w-[320px]">
                <div className="overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_40px_90px_-40px_rgba(0,0,0,1)]">
                  <div className="aspect-[3/4]">
                    <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
                  </div>
                </div>
                <dl className="mt-4 space-y-2.5 rounded-2xl border border-white/[0.07] bg-black/35 p-4 backdrop-blur-md">
                  {[
                    { icon: <IconServer width={13} height={13} />, k: 'Cloud tier', v: game.cloud_tier.toUpperCase() },
                    { icon: <IconCpu width={13} height={13} />, k: 'Runtime', v: game.play_mode === 'native' ? 'Browser engine' : 'Streamed container' },
                    { icon: <IconGauge width={13} height={13} />, k: 'Target', v: game.cloud_tier === 'ultra' ? '4K60' : '1080p60' },
                    { icon: <IconCloud width={13} height={13} />, k: 'Downloads', v: '0 GB on your device' },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <dt className="flex items-center gap-2 text-[color:var(--text-faint)]">
                        {row.icon}
                        {row.k}
                      </dt>
                      <dd className="font-mono font-semibold text-white/85">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ---------- body ---------- */}
      <div className="section grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="text-[19px] font-semibold tracking-tight text-white">About this title</h2>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.75] text-[color:var(--text-dim)]">{game.description}</p>
            {game.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {game.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/games?q=${encodeURIComponent(tag)}`}
                    className="chip transition-colors hover:!border-white/25 hover:!text-white"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[19px] font-semibold tracking-tight text-white">What you need</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(game.requirements ?? {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.022] px-4 py-3">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[color:var(--text-faint)]">{k}</span>
                  <span className="text-right text-[13px] font-medium text-white/85">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--text-faint)]">
              Runs on anything with a modern browser — Chrome, Edge, Firefox or Safari. A 15 Mbps connection is plenty for
              1080p60; ultra tier recommends 35 Mbps.
            </p>
          </section>

          {board.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-[19px] font-semibold tracking-tight text-white">Top scores</h2>
                <Link href="/leaderboard" className="text-[12.5px] text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
                  Full leaderboard
                </Link>
              </div>
              <div className="panel overflow-hidden rounded-2xl">
                {board.map((row, i) => {
                  const name = row.profiles?.display_name || row.profiles?.username || row.guest_name || 'Anonymous';
                  return (
                    <div key={row.id} className="flex items-center gap-3 border-b border-white/[0.045] px-4 py-3 last:border-0">
                      <span className="w-6 font-mono text-[12.5px] font-bold tabular-nums text-white/35">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[10.5px] font-bold text-white" style={{ background: withAlpha(game.accent, 0.5) }}>
                        {initials(name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/85">{name}</span>
                      <span className="font-mono text-[13px] font-bold tabular-nums text-white">{row.score.toLocaleString()}</span>
                      <span className="hidden w-20 text-right text-[11px] text-[color:var(--text-faint)] sm:block">{timeAgo(row.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ---------- sidebar ---------- */}
        <aside className="space-y-8">
          {similar.length > 0 && (
            <section>
              <h2 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">More {game.genre.replace('-', ' ')}</h2>
              <div className="space-y-2">
                {similar.map((g) => (
                  <GameRow key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}
          {more.length > 0 && (
            <section>
              <h2 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">You might also like</h2>
              <div className="space-y-2">
                {more.map((g) => (
                  <GameRow key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
