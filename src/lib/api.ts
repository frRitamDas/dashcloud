import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAdminSession, AdminAuthError, type AdminSessionPayload } from './admin-session';
import { supabaseAdmin } from './supabase/admin';
import { clientIp, rateLimit } from './rate-limit';

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function logActivity(entry: {
  actor: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin().from('activity_log').insert({
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      meta: entry.meta ?? {},
    });
  } catch {
    /* logging must never break a request */
  }
}

type Handler<T = unknown> = (req: Request, ctx: T, admin: AdminSessionPayload) => Promise<Response>;

/** Wraps an admin route handler: verifies the signed cookie + records the action. */
export function withAdmin<T = unknown>(method: string, handler: Handler<T>) {
  return async (req: Request, ctx: { params: Promise<T> }) => {
    try {
      if (req.method !== method && method !== 'ANY') {
        return fail('Method not allowed', 405);
      }
      const admin = await getAdminSession();
      if (!admin) return fail('Unauthorized', 401);

      const ip = clientIp(req);
      const limited = rateLimit(`admin-write:${ip}`, 120, 60_000);
      if (!limited.ok) return fail('Too many requests', 429, { retryAfter: limited.retryAfter });

      const params = await ctx.params;
      return await handler(req, params, admin);
    } catch (err) {
      return handleApiError(err);
    }
  };
}

export function withPublicRateLimit(key: string, limit = 30, windowMs = 60_000) {
  return (req: Request) => rateLimit(`${key}:${clientIp(req)}`, limit, windowMs);
}

export function handleApiError(err: unknown): Response {
  if (err instanceof AdminAuthError) return fail('Unauthorized', 401);
  if (err instanceof ZodError) {
    return fail('Validation failed', 422, { issues: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (message.includes('Missing SUPABASE')) return fail('Server configuration error', 500);
  console.error('[api]', message);
  return fail('Internal server error', 500);
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
