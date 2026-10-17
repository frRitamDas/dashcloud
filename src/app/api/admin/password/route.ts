import { supabaseAdmin } from '@/lib/supabase/admin';
import { passwordSchema } from '@/lib/admin-schemas';
import { generateSalt, hashPassword, verifyPassword } from '@/lib/password';
import { fail, json, logActivity, readJson, withAdmin } from '@/lib/api';
import { clearAdminCookie } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export const POST = withAdmin('POST', async (req, _params, admin) => {
  const body = passwordSchema.parse(await readJson(req));
  const db = supabaseAdmin();

  const { data: row } = await db.from('admins').select('id,salt,password_hash').eq('id', admin.sub).maybeSingle();
  if (!row) return fail('Admin account not found', 404);

  if (!verifyPassword(body.currentPassword, row.salt, row.password_hash)) {
    await logActivity({ actor: admin.username, action: 'admin.password_change.failed', entity: 'admin', entityId: admin.sub });
    return fail('Current password is incorrect.', 403);
  }

  const salt = generateSalt();
  const { error } = await db.from('admins').update({ salt, password_hash: hashPassword(body.newPassword, salt) }).eq('id', admin.sub);
  if (error) return fail(error.message, 500);

  await logActivity({ actor: admin.username, action: 'admin.password_changed', entity: 'admin', entityId: admin.sub });
  // Force re-authentication with the new credential.
  await clearAdminCookie();
  return json({ ok: true, reauthenticate: true });
});
