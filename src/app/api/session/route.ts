import { sessionEndSchema, sessionStartSchema, sessionStreamingSchema } from '@/features/sessions/contracts';
import { endSession, markSessionStreaming, SessionServiceError, startSession } from '@/features/sessions/service';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const startLimit = withPublicRateLimit('session-start', 25, 60_000);
const endLimit = withPublicRateLimit('session-end', 40, 60_000);
const streamingLimit = withPublicRateLimit('session-streaming', 60, 60_000);

function serviceFailure(error: unknown) {
  if (error instanceof SessionServiceError) return fail(error.message, error.status);
  console.error('[sessions:request]', error instanceof Error ? error.message : error);
  return fail('Session service is temporarily unavailable.', 503);
}

export async function POST(req: Request) {
  const raw = await readJson<Record<string, unknown>>(req);

  if (raw.sessionId && (raw.end === true || raw.durationSeconds !== undefined)) {
    const parsed = sessionEndSchema.safeParse(raw);
    if (!parsed.success) return fail('Invalid session end payload', 422);
    const rate = endLimit(req);
    if (!rate.ok) return fail('Too many session updates', 429, { retryAfter: rate.retryAfter });
    try {
      return json(await endSession(parsed.data));
    } catch (error) {
      return serviceFailure(error);
    }
  }

  if (raw.sessionId && raw.streaming === true) {
    const parsed = sessionStreamingSchema.safeParse(raw);
    if (!parsed.success) return fail('Invalid session update payload', 422);
    const rate = streamingLimit(req);
    if (!rate.ok) return fail('Too many session updates', 429, { retryAfter: rate.retryAfter });
    try {
      return json(await markSessionStreaming(parsed.data));
    } catch (error) {
      return serviceFailure(error);
    }
  }

  const rate = startLimit(req);
  if (!rate.ok) return fail('Too many sessions started. Please slow down.', 429, { retryAfter: rate.retryAfter });

  const parsed = sessionStartSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('Invalid session start payload', 422, {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  try {
    return json(await startSession(parsed.data), { status: 201 });
  } catch (error) {
    return serviceFailure(error);
  }
}

export async function PATCH(req: Request) {
  const parsed = sessionEndSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('Invalid session end payload', 422);

  const rate = endLimit(req);
  if (!rate.ok) return fail('Too many session updates', 429, { retryAfter: rate.retryAfter });

  try {
    return json(await endSession(parsed.data));
  } catch (error) {
    return serviceFailure(error);
  }
}
