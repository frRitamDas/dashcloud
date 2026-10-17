import { getGames } from '@/lib/queries';
import { fail, json, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const limit = withPublicRateLimit('games-search', 90, 60_000);

export async function GET(req: Request) {
  const l = limit(req);
  if (!l.ok) return fail('Too many requests', 429, { retryAfter: l.retryAfter });

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').slice(0, 80);
  const genre = (url.searchParams.get('genre') ?? '').slice(0, 40);
  const mode = url.searchParams.get('mode');
  const sort = (url.searchParams.get('sort') ?? 'popular') as 'popular' | 'rating' | 'newest' | 'az';
  const limitTo = Math.min(60, Number(url.searchParams.get('limit') ?? 24));

  const games = await getGames({
    search: q || undefined,
    genre: genre || undefined,
    playMode: mode === 'native' || mode === 'cloud' ? mode : undefined,
    sort,
    limit: Number.isFinite(limitTo) ? limitTo : 24,
  });

  return json({ games, count: games.length });
}
