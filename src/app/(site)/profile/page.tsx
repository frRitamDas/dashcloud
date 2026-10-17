import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/components/profile/ProfileClient';
import { getPlayerFavorites, getPlayerScores, getProfile } from '@/lib/queries';
import { supabaseServer } from '@/lib/supabase/server';
import { LogoMark } from '@/components/ui/Logo';
import type { Profile } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'My profile', robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect('/login?next=/profile');

  const [profile, scores, favourites] = await Promise.all([getProfile(user.id), getPlayerScores(user.id, 60), getPlayerFavorites(user.id)]);

  if (!profile) {
    // Account exists in auth but the profile row was never created — repair it.
    const username = (user.email ?? 'player').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    await sb.from('profiles').insert({ id: user.id, username, display_name: username });
    const repaired = (await getProfile(user.id)) as Profile | null;
    if (!repaired) {
      return (
        <div className="section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <LogoMark size={44} />
          <h1 className="mt-6 text-[22px] font-semibold tracking-tight text-white">We could not load your profile</h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-[color:var(--text-dim)]">
            Your account exists but the profile row is missing. Try again in a moment, or contact support and we will repair it.
          </p>
          <div className="mt-6 flex gap-2">
            <Link href="/profile" className="btn-primary">Retry</Link>
            <Link href="/support" className="btn-ghost">Contact support</Link>
          </div>
        </div>
      );
    }
    return (
      <ProfileClient
        profile={repaired}
        email={user.email ?? ''}
        favourites={favourites}
        scores={scores}
        initialTab={(sp.tab as 'overview' | 'library' | 'scores' | 'settings') ?? 'overview'}
      />
    );
  }

  return (
    <ProfileClient
      profile={profile}
      email={user.email ?? ''}
      favourites={favourites}
      scores={scores}
      initialTab={(sp.tab as 'overview' | 'library' | 'scores' | 'settings') ?? 'overview'}
    />
  );
}
