import { gameListQuerySchema } from '@/features/games/contracts';
import { listGames } from '@/features/games/service';
import { fail, json, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const limit = withPublicRateLimit('games-search', 90, 60_000);

export async function GET(req: Request) {
  const rate = limit(req);
  if (!rate.ok) {
    return fail('Too many requests', 429, { retryAfter: rate.retryAfter });
  }

  const url = new URL(req.url);
  const parsed = gameListQuerySchema.safeParse({
    q: url.searchParams.get('q') ?? undefined,
    genre: url.searchParams.get('genre') ?? undefined,
    mode: url.searchParams.get('mode') ?? undefined,
    sort: url.searchParams.get('sort') ?? 'popular',
    limit: url.searchParams.get('limit') ?? 24,
  });

  if (!parsed.success) {
    return fail('Invalid catalogue query', 400, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const games = await listGames(parsed.data);
    return json({ games, count: games.length });
  } catch (error) {
    console.error('[games:list]', error instanceof Error ? error.message : error);
    return fail('The game catalogue is temporarily unavailable', 503);
  }
}
