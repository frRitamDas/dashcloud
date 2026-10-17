import { supabaseAdmin } from '@/lib/supabase/admin';
import { fail, json, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async (req) => {
  const url = new URL(req.url);
  const active = url.searchParams.get('active') === '1';
  const take = Math.min(200, Number(url.searchParams.get('limit') ?? 60));

  let query = supabaseAdmin()
    .from('game_sessions')
    .select('id,user_id,guest_id,region,status,resolution,latency_ms,started_at,ended_at,duration_seconds,games(title,slug,accent,genre),profiles(username,display_name,level)')
    .order('started_at', { ascending: false })
    .limit(take);

  if (active) query = query.in('status', ['booting', 'streaming']);
  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  const total = await supabaseAdmin().from('game_sessions').select('id', { count: 'exact', head: true });
  return json({ sessions: data ?? [], total: total.count ?? 0 });
});
