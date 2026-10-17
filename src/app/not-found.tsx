import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';
import { getGames } from '@/lib/queries';
import { GameRow } from '@/components/games/GameRowList';
import { IconArrowRight, IconSearch } from '@/components/ui/Icons';

export default async function NotFound() {
  const games = await getGames({ limit: 5, status: 'live' }).catch(() => []);

  return (
    <div className="section flex min-h-[76vh] flex-col items-center justify-center py-16 text-center">
      <LogoMark size={48} />
      <p className="mt-8 font-mono text-[12px] font-bold uppercase tracking-[0.3em] text-brand-300">404</p>
      <h1 className="h-display mt-3 text-[34px] leading-tight sm:text-[46px]">This route does not exist</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[color:var(--text-dim)]">
        The page you asked for is not part of Dash. It may have been renamed, or the link is old. Everything below is
        definitely playable right now.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Link href="/" className="btn-primary">
          Back to home <IconArrowRight width={16} height={16} />
        </Link>
        <Link href="/games" className="btn-ghost">
          <IconSearch width={15} height={15} /> Browse all games
        </Link>
      </div>

      {games.length > 0 && (
        <div className="mt-12 w-full max-w-[420px] text-left">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">Popular right now</p>
          <div className="space-y-2">
            {games.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
