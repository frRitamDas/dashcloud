import type { Metadata } from 'next';
import Link from 'next/link';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import { getGames, getLeaderboard, getGlobalTopScores, getSiteSettings } from '@/lib/queries';
import { Reveal } from '@/components/ui/Reveal';
import { GameRow } from '@/components/games/GameRowList';
import { IconArrowRight, IconBolt, IconTrophy } from '@/components/ui/Icons';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Leaderboards',
  description: 'Live global leaderboards for every playable Dash engine — updated in real time as runs are submitted.',
};

export default async function LeaderboardPage() {
  const [games, globalScores, settings] = await Promise.all([getGames({ playMode: 'native', limit: 10 }), getGlobalTopScores(10), getSiteSettings()]);

  const boards: Record<string, Awaited<ReturnType<typeof getLeaderboard>>> = {};
  for (const g of games) {
    boards[g.slug] = await getLeaderboard(g.slug, 25);
  }

  return (
    <div className="section py-10 lg:py-14">
      <header className="mb-9">
        <span className="kicker">Competitive</span>
        <h1 className="h-display mt-2.5 text-[34px] leading-tight sm:text-[46px]">Leaderboards</h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--text-dim)]">
          Every finished run is written to Postgres and pushed to these boards in real time through Supabase realtime —
          watch entries land while you play. Boards reset every Monday at 00:00 IST.
        </p>
      </header>

      <LeaderboardClient games={games} initial={boards} />

      <Reveal className="mt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <IconTrophy width={16} height={16} className="text-[#fbbf24]" />
              <h2 className="text-[17px] font-semibold tracking-tight text-white">Global hall of fame</h2>
            </div>
            <div className="panel divide-y divide-white/[0.05] overflow-hidden rounded-2xl">
              {globalScores.length === 0 && (
                <p className="px-5 py-10 text-center text-[13px] text-[color:var(--text-faint)]">No runs recorded yet — be the first.</p>
              )}
              {globalScores.map((row, i) => {
                const name = row.profiles?.display_name || row.profiles?.username || row.guest_name || 'Anonymous';
                return (
                  <div key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-6 font-mono text-[12.5px] font-bold tabular-nums text-white/30">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-white">{name}</span>
                      <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">{row.games?.title}</span>
                    </span>
                    {row.games && (
                      <Link
                        href={`/play/${row.games.slug}`}
                        className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] font-semibold text-white/75 transition-colors hover:border-white/20 hover:text-white sm:flex"
                      >
                        <IconBolt width={12} height={12} /> Play
                      </Link>
                    )}
                    <span className="shrink-0 font-mono text-[14px] font-bold tabular-nums" style={{ color: row.games?.accent ?? '#fff' }}>
                      {row.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <aside>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Climb these boards</h2>
              <Link href="/games?mode=native" className="text-[12px] text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
                All games
              </Link>
            </div>
            <div className="space-y-2">
              {games.slice(0, 7).map((g) => (
                <GameRow key={g.id} game={g} />
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
              <h3 className="text-[14px] font-semibold text-white">How scoring works</h3>
              <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                <li>· Signed-in players submit scores tied to their profile.</li>
                <li>· Guests can submit with a display name, capped by rate limiting.</li>
                <li>· Server-side validation rejects impossible values.</li>
                <li>· Operators can remove cheated entries from the admin panel.</li>
              </ul>
              <Link href="/admin" className="btn-ghost mt-4 w-full justify-center !py-2 !text-[12.5px]">
                Admin panel <IconArrowRight width={14} height={14} />
              </Link>
            </div>
          </aside>
        </div>
      </Reveal>

      <p className="mt-10 text-center text-[12px] text-[color:var(--text-faint)]">
        {settings.site.fullName} · {settings.site.credits}
      </p>
    </div>
  );
}
