import 'server-only';

interface Bucket {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

/**
 * In-memory sliding-window limiter. On Vercel this is per-instance, which is
 * enough to blunt credential stuffing and spam; combine with the DB lockout
 * on the admins table for real protection.
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000, blockMs = 0) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }

  if (!bucket) {
    buckets.set(key, { count: 1, resetAt: now + windowMs, blockedUntil: 0 });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.blockedUntil > now) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000) };
  }

  if (bucket.resetAt < now) {
    bucket.count = 1;
    bucket.resetAt = now + windowMs;
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    if (blockMs > 0) bucket.blockedUntil = now + blockMs;
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.blockedUntil > now ? bucket.blockedUntil - now : bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
