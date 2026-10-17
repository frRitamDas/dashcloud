'use client';

import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

export function useUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    async function loadProfile(user: User | undefined) {
      if (!user) {
        if (mounted) setProfile(null);
        return;
      }
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (mounted) setProfile((data as Profile) ?? null);
    }

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      await loadProfile(data.session?.user);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      loadProfile(next?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user: session?.user ?? null, profile, session, loading };
}
