import Link from 'next/link';
import type { Game, ScoreRow } from '@/lib/supabase/types';
import { GameRow } from '@/components/games/GameCard';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from './Sections';
import { IconArrowRight, IconBolt, IconLayers, IconTrophy } from '@/components/ui/Icons';
import { hashString, initials, shade, timeAgo, withAlpha } from '@/lib/utils';

export function GenreGrid({ games }: { games: Game[] }) {
  const grouped = new Map<string, Game[]>();
  games.forEach((g) => {
    const list = grouped.get(g.genre) ?? [];
    list.push(g);
    grouped.set(g.genre, list);
  });
  const genres = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  return (
    <section className="section py-16 lg:py-20">
      <SectionHeading
        kicker="Browse by mood"
        title="Every genre, zero downloads"
        copy="Filter the whole catalogue by genre — each collection opens instantly in the browser."
        action={
          <Link href="/games" className="btn-ghost">
            All genres <IconArrowRight width={15} height={15} />
          </Link>
        }
      />
      <RevealGroup className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {genres.map(([genre, list]) => {
          const seed = hashString(genre);
          const accent = list[0]?.accent ?? '#6d5cff';
          return (
            <RevealItem key={genre}>
              <Link
                href={`/games?genre=${encodeURIComponent(genre)}`}
                className="card-hover group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5"
              >
                <span
                  className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: withAlpha(accent, 0.2), opacity: 0.55 }}
                />
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(to top, ${withAlpha(accent, 0.14)}, transparent)` }}
                />
                <span className="relative">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] text-[12px] font-bold"
                      style={{ background: withAlpha(accent, 0.14), color: accent }}
                    >
                      {String(seed % 90 + 10)}
                    </span>
                    <span className="text-[15px] font-semibold capitalize tracking-tight text-white">{genre.replace('-', ' ')}</span>
                  </span>
                  <span className="mt-3 block text-[12.5px] text-[color:var(--text-faint)]">
                    {list.length} title{list.length === 1 ? '' : 's'} · {list.filter((g) => g.play_mode === 'native').length} instant
                  </span>
                </span>
                <span className="relative mt-5 flex flex-wrap gap-1.5">
                  {list.slice(0, 3).map((g) => (
                    <span key={g.id} className="truncate rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10.5px] text-white/60">
                      {g.title}
                    </span>
                  ))}
                </span>
                <span className="relative mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-white/50 transition-colors group-hover:text-white">
                  Explore {genre.replace('-', ' ')} <IconArrowRight width={13} height={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}

export function TrendingLists({ trending, instant }: { trending: Game[]; instant: Game[] }) {
  return (
    <section className="section py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <div>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-neon-rose">
              <IconTrophy width={16} height={16} />
            </span>
            <div>
              <h2 className="text-[19px] font-semibold tracking-tight text-white">Trending this week</h2>
              <p className="text-[12.5px] text-[color:var(--text-faint)]">Ranked by concurrent players across all regions</p>
            </div>
          </div>
          <Reveal>
            <div className="space-y-2">
              {trending.slice(0, 6).map((g, i) => (
                <GameRow key={g.id} game={g} rank={i + 1} />
              ))}
            </div>
          </Reveal>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-neon-mint">
              <IconBolt width={16} height={16} />
            </span>
            <div>
              <h2 className="text-[19px] font-semibold tracking-tight text-white">Instant play — no queue</h2>
              <p className="text-[12.5px] text-[color:var(--text-faint)]">Native browser engines, playable in one click</p>
            </div>
          </div>
          <Reveal>
            <div className="space-y-2">
              {instant.slice(0, 6).map((g, i) => (
                <GameRow key={g.id} game={g} rank={i + 1} />
              ))}
            </div>
          </Reveal>
          <Link href="/games?mode=native" className="btn-ghost mt-4 w-full justify-center">
            <IconLayers width={15} height={15} /> See the full instant-play library
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LeaderboardTeaser({ scores }: { scores: ScoreRow[] }) {
  if (!scores.length) return null;
  return (
    <section className="section py-16 lg:py-20">
      <SectionHeading
        kicker="Leaderboards"
        title="Global top scores right now"
        copy="Every finished run is written to Postgres and pushed to the live boards. Weekly resets keep the chase honest."
        action={
          <Link href="/leaderboard" className="btn-ghost">
            Full leaderboards <IconArrowRight width={15} height={15} />
          </Link>
        }
      />
      <Reveal>
        <div className="panel overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[54px_1fr_150px_110px_90px] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] sm:grid">
            <span>Rank</span>
            <span>Player</span>
            <span>Title</span>
            <span className="text-right">Score</span>
            <span className="text-right">When</span>
          </div>
          {scores.slice(0, 8).map((row, i) => {
            const name = row.profiles?.display_name || row.profiles?.username || row.guest_name || 'Anonymous';
            const medal = i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#d9915b' : undefined;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.025] sm:grid-cols-[54px_1fr_150px_110px_90px]"
              >
                <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: medal ?? 'rgba(255,255,255,0.35)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10.5px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${row.games?.accent ?? '#6d5cff'}, ${shade(row.games?.accent ?? '#6d5cff', -0.35)})` }}
                  >
                    {initials(name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-white">{name}</span>
                    <span className="block text-[11px] text-[color:var(--text-faint)] sm:hidden">{row.games?.title}</span>
                  </span>
                </span>
                <span className="hidden truncate text-[12.5px] text-[color:var(--text-dim)] sm:block">{row.games?.title ?? '—'}</span>
                <span className="hidden text-right font-mono text-[13px] font-bold tabular-nums text-white sm:block">{row.score.toLocaleString()}</span>
                <span className="text-right font-mono text-[13px] font-bold tabular-nums text-white sm:hidden">{row.score.toLocaleString()}</span>
                <span className="hidden text-right text-[11.5px] text-[color:var(--text-faint)] sm:block">{timeAgo(row.created_at)}</span>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
