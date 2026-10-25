'use client';

/** Thin fetch wrapper for the admin API: JSON in, typed JSON out, readable errors. */
export async function adminApi<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) throw new Error('Admin requests must stay on this site.');
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The request took too long. Check your connection and try again.');
    }
    throw new Error('Could not reach Dash Cloud. Check your connection and try again.');
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const p = payload as { error?: string; issues?: { path?: string | (string | number)[]; message?: string }[] } | null;
    const detail = p?.issues?.length
      ? p.issues.map((i) => `${Array.isArray(i.path) ? i.path.join('.') : i.path ?? 'field'}: ${i.message ?? 'Invalid value'}`).join(' · ')
      : '';
    const message = res.status === 401
      ? 'Your admin session has expired. Sign in again.'
      : res.status === 403
        ? 'You do not have permission to perform this action.'
        : res.status === 429
          ? (p?.error ?? 'Too many requests. Wait a moment and try again.')
          : (p?.error ?? `Request failed (${res.status})`);
    throw new Error([message, detail].filter(Boolean).join(' — '));
  }

  return payload as T;
}
