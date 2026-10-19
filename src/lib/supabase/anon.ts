import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './config';

let client: SupabaseClient | null = null;

/** Anon-key client for server-side public reads (respects RLS). */
export function supabaseAnon(): SupabaseClient {
  if (client) return client;
  const { url, key } = getSupabasePublicConfig();
  client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
