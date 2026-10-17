import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  subject: z.string().min(3).max(140),
  body: z.string().min(10).max(4000),
  category: z.enum(['technical', 'account', 'billing', 'report', 'other']).default('technical'),
});

const limit = withPublicRateLimit('ticket', 4, 10 * 60_000);

export async function POST(req: Request) {
  const l = limit(req);
  if (!l.ok) return fail('You have opened too many tickets. Please wait a few minutes.', 429, { retryAfter: l.retryAfter });

  const parsed = schema.parse(await readJson(req));
  const { data, error } = await supabaseAdmin()
    .from('tickets')
    .insert({ ...parsed, status: 'open', priority: 'normal' })
    .select('id,reference,created_at')
    .single();

  if (error) return fail(error.message, 500);
  return json({ ok: true, ticket: data });
}
