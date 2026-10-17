'use client';

/** Thin fetch wrapper for the admin API: JSON in, typed JSON out, readable errors. */
export async function adminApi<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const p = payload as { error?: string; issues?: { path: string; message: string }[] } | null;
    const detail = p?.issues?.length ? p.issues.map((i) => `${i.path}: ${i.message}`).join(' · ') : '';
    throw new Error([p?.error ?? `Request failed (${res.status})`, detail].filter(Boolean).join(' — '));
  }

  return payload as T;
}
