'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/Toast';
import { IconCheck, IconHeart, IconShare } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

export function GameActions({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useUser();
  const { push } = useToast();
  const [faved, setFaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabaseBrowser()
        .from('favorites')
        .select('game_id')
        .eq('user_id', user.id)
        .eq('game_id', game.id)
        .maybeSingle();
      if (alive) setFaved(Boolean(data));
    })();
    return () => {
      alive = false;
    };
  }, [game.id, user]);

  async function toggleFav() {
    if (!user) {
      push('Sign in to save this title to your library.', 'info');
      router.push(`/login?next=/games/${game.slug}`);
      return;
    }
    const sb = supabaseBrowser();
    if (faved) {
      await sb.from('favorites').delete().eq('user_id', user.id).eq('game_id', game.id);
      setFaved(false);
      push('Removed from your library', 'info');
    } else {
      await sb.from('favorites').insert({ user_id: user.id, game_id: game.id });
      setFaved(true);
      push('Saved to your library', 'success');
    }
  }

  async function share() {
    const url = `${window.location.origin}/games/${game.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${game.title} on Dash`, text: game.tagline ?? undefined, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      push('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      push('Sharing was blocked by the browser.', 'error');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleFav}
        className={cn(
          'btn-outline !py-3.5 !rounded-2xl transition-colors',
          faved && '!border-[rgba(251,113,133,0.5)] !bg-[rgba(251,113,133,0.12)] !text-[#fda4af]',
        )}
        aria-pressed={faved}
      >
        <IconHeart width={16} height={16} className={faved ? 'fill-current' : ''} />
        {faved ? 'In library' : 'Save'}
      </button>
      <button onClick={share} className="btn-outline !py-3.5 !rounded-2xl" aria-label="Share this game">
        {copied ? <IconCheck width={16} height={16} className="text-neon-mint" /> : <IconShare width={16} height={16} />}
        {copied ? 'Copied' : 'Share'}
      </button>
    </div>
  );
}
