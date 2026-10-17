import { supabaseAdmin } from '@/lib/supabase/admin';
import { fail, json, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async (req) => {
  const url = new URL(req.url);
  const take = Math.min(200, Number(url.searchParams.get('limit') ?? 60));
  const { data, error } = await supabaseAdmin().from('activity_log').select('*').order('created_at', { ascending: false }).limit(take);
  if (error) return fail(error.message, 500);
  return json({ activity: data ?? [] });
});
