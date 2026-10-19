import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig, hasSupabasePublicConfig } from './config';

let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  const { url, key } = getSupabasePublicConfig();
  cached = createBrowserClient(url, key, {
    realtime: { params: { eventsPerSecond: 8 } },
  });
  return cached;
}

export const isSupabaseConfigured = hasSupabasePublicConfig();
