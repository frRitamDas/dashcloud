import { getLiveStats } from '@/lib/queries';
import { fail, json, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const limit = withPublicRateLimit('live', 120, 60_000);

export async function GET(req: Request) {
  const l = limit(req);
  if (!l.ok) return fail('Too many requests', 429, { retryAfter: l.retryAfter });
  const stats = await getLiveStats();
  return json(stats, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } });
}
