import { scoreSubmissionSchema } from '@/features/scores/contracts';
import { ScoreSubmissionError, submitScore } from '@/features/scores/service';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const postLimit = withPublicRateLimit('score-submit', 40, 60_000);
const readLimit = withPublicRateLimit('score-read', 90, 60_000);

export async function POST(req: Request) {
  const rate = postLimit(req);
  if (!rate.ok) return fail('Too many score submissions', 429, { retryAfter: rate.retryAfter });

  const parsed = scoreSubmissionSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('Invalid score submission', 422, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await submitScore(parsed.data);
    return json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof ScoreSubmissionError) return fail(error.message, error.status);
    console.error('[scores:submit]', error instanceof Error ? error.message : error);
    return fail('Score submission is temporarily unavailable.', 503);
  }
}

export async function GET(req: Request) {
  const rate = readLimit(req);
  if (!rate.ok) return fail('Too many requests', 429, { retryAfter: rate.retryAfter });

  const url = new URL(req.url);
  const slug = (url.searchParams.get('slug') ?? '').trim().toLowerCase();
  const rawLimit = Number(url.searchParams.get('limit') ?? 20);
  const take = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, Math.trunc(rawLimit))) : 20;

  if (!slug || slug.length > 80) return fail('A valid game slug is required', 400);

  const db = await supabaseServer();
  const { data: game, error: gameError } = await db.from('games').select('id').eq('slug', slug).eq('published', true).maybeSingle();
  if (gameError) {
    console.error('[scores:read-game]', gameError.code, gameError.message);
    return fail('Leaderboard is temporarily unavailable.', 503);
  }
  if (!game) return fail('Game not found', 404);

  const { data, error } = await db
    .from('scores')
    .select('id,score,metric,created_at,guest_name,profiles(username,display_name,avatar_url,level)')
    .eq('game_id', game.id)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(take);

  if (error) {
    console.error('[scores:read]', error.code, error.message);
    return fail('Leaderboard is temporarily unavailable.', 503);
  }

  return json({ scores: data ?? [] });
}
