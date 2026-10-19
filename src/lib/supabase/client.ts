import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig, hasSupabasePublicConfig } from './config';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string;

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
