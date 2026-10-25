import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { issueAdminSession } from '@/lib/admin-session';
import { verifyPassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { fail, json, logActivity, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(2).max(40),
  password: z.string().min(4).max(200),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`admin-login:${ip}`, 6, 10 * 60_000, 15 * 60_000);
  if (!rl.ok) {
    return fail(`Too many login attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minute(s).`, 429, { retryAfter: rl.retryAfter });
  }

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('Please enter a valid username and password.', 422, {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    console.error('[admin-login] ADMIN_SESSION_SECRET is missing or too short.');
    return fail('Admin sign-in is temporarily unavailable because secure session signing is not configured.', 503);
  }

  const body = parsed.data;
  const db = supabaseAdmin();
  const { data: admin, error: lookupError } = await db.from('admins').select('*').eq('username', body.username).maybeSingle();
  if (lookupError) {
    console.error('[admin-login] Admin lookup failed:', lookupError.code);
    return fail('Admin sign-in is temporarily unavailable. Please try again.', 503);
  }

  const generic = 'Invalid username or password.';
  if (!admin) {
    // Constant-ish work so the response time does not leak account existence.
    verifyPassword(body.password, 'deadbeefdeadbeefdeadbeefdeadbeef', '0'.repeat(64));
    await logActivity({ actor: body.username, action: 'admin.login.unknown_user', entity: 'admin', meta: { ip } });
    return fail(generic, 401);
  }
  if (!admin.active) return fail('This admin account is disabled.', 403);
  if (admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
    const mins = Math.ceil((new Date(admin.locked_until).getTime() - Date.now()) / 60000);
    return fail(`Account temporarily locked after repeated failures. Retry in ${mins} minute(s).`, 423);
  }

  const rlUser = rateLimit(`admin-login-user:${admin.username}`, 6, 10 * 60_000, 15 * 60_000);
  if (!rlUser.ok) return fail('Too many attempts for this account. Try again later.', 429);

  const valid = verifyPassword(body.password, admin.salt, admin.password_hash);
  if (!valid) {
    const attempts = (admin.failed_attempts ?? 0) + 1;
    const lock = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
    await db.from('admins').update({ failed_attempts: attempts, locked_until: lock }).eq('id', admin.id);
    await logActivity({
      actor: admin.username,
      action: 'admin.login.failed',
      entity: 'admin',
      entityId: admin.id,
      meta: { ip, attempts, locked: Boolean(lock) },
    });
    return fail(lock ? `Too many failed attempts — locked for ${LOCK_MINUTES} minutes.` : generic, lock ? 423 : 401);
  }

  await db.from('admins').update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString(), last_login_ip: ip }).eq('id', admin.id);
  await issueAdminSession({ sub: admin.id, username: admin.username, role: admin.role });
  await logActivity({ actor: admin.username, action: 'admin.login.success', entity: 'admin', entityId: admin.id, meta: { ip } });

  return json({
    ok: true,
    admin: { id: admin.id, username: admin.username, role: admin.role, lastLoginAt: admin.last_login_at },
  });
}
