import 'server-only';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  createAdminToken,
  verifyAdminToken,
  type AdminSessionPayload,
} from './admin-session-core';

export { ADMIN_COOKIE };
export type { AdminSessionPayload };

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  return verifyAdminToken(
    store.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    ...ADMIN_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', { ...ADMIN_COOKIE_OPTIONS, secure: true, maxAge: 0 });
}

export async function issueAdminSession(payload: { sub: string; username: string; role: string }) {
  const token = await createAdminToken(payload, process.env.ADMIN_SESSION_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY);
  await setAdminCookie(token);
  return token;
}

export class AdminAuthError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AdminAuthError';
  }
}

export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) throw new AdminAuthError();
  return session;
}
