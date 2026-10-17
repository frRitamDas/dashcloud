import Link from 'next/link';
import type { Game } from '@/lib/supabase/types';
import { GameArt } from '@/components/art/GameArt';
import { IconPlay } from '@/components/ui/Icons';
import { formatNumber, withAlpha } from '@/lib/utils';

/** Server-renderable compact row (no client JS) used inside static sections. */
export function GameRow({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.045]"
    >
      <span className="h-12 w-9 shrink-0 overflow-hidden rounded-md">
        <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-white">{game.title}</span>
        <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">
          {game.genre} · {formatNumber(game.players_online)} playing
        </span>
      </span>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: withAlpha(game.accent, 0.16), color: game.accent }}
      >
        <IconPlay width={13} height={13} />
      </span>
    </Link>
  );
}
