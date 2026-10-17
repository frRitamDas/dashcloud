/**
 * Edge-safe admin session verification (no node:crypto — uses Web Crypto).
 * Shared by middleware and route handlers so the cookie format never drifts.
 */
export const ADMIN_COOKIE = 'dash_admin_session';

export interface AdminSessionPayload {
  sub: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
  nonce: string;
}

function secretFrom(envSecret?: string, serviceKey?: string): string {
  if (envSecret && envSecret.length >= 16) return envSecret;
  return `dash-fallback::${serviceKey ?? 'unset'}`;
}

const encoder = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyAdminToken(
  token: string | undefined | null,
  envSecret?: string,
  serviceKey?: string,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = await hmac(secretFrom(envSecret, serviceKey), body);
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as AdminSessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.sub || !payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createAdminToken(
  payload: Omit<AdminSessionPayload, 'iat' | 'exp' | 'nonce'>,
  envSecret?: string,
  serviceKey?: string,
): Promise<string> {
  const now = Date.now();
  const full: AdminSessionPayload = {
    ...payload,
    iat: now,
    exp: now + 1000 * 60 * 60 * 8,
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  };
  const body = btoa(JSON.stringify(full)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmac(secretFrom(envSecret, serviceKey), body);
  return `${body}.${sig}`;
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8,
};
