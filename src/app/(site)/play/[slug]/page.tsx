import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlayClient } from '@/components/play/PlayClient';
import { getGameBySlug, getGames, getServiceStatus } from '@/lib/queries';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: 'Session not found' };
  return {
    title: `Playing ${game.title}`,
    description: `Live cloud session for ${game.title} on Dash — streamed straight into your browser.`,
    robots: { index: false, follow: false },
  };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const sb = await supabaseServer();
  const [game, statuses, games] = await Promise.all([
    getGameBySlug(slug),
    getServiceStatus(),
    getGames({ playMode: 'native', limit: 8 }),
  ]);
  if (!game) notFound();
  if (!game.published) notFound();

  const {
    data: { user },
  } = await sb.auth.getUser();

  let playerName = 'Guest';
  if (user) {
    const { data: profile } = await sb.from('profiles').select('display_name,username').eq('id', user.id).maybeSingle();
    playerName = (profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Player').slice(0, 24);
    await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
  }

  return (
    <PlayClient
      game={game}
      statuses={statuses}
      playerName={playerName}
      alternatives={games.filter((g) => g.id !== game.id)}
    />
  );
}
