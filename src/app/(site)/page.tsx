import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { LiveMarquee } from '@/components/home/Marquee';
import { FeaturedRail } from '@/components/home/FeaturedRail';
import { GenreGrid, LeaderboardTeaser, TrendingLists } from '@/components/home/Collections';
import { FinalCta, HowItWorks, PricingTeaser, RegionsStrip, StatsBand, Technology, Voices } from '@/components/home/Sections';
import { getAnnouncements, getGames, getGlobalTopScores, getLiveStats, getServiceStatus, getSiteSettings } from '@/lib/queries';
import { AnnouncementBar } from '@/components/home/AnnouncementBar';

export const revalidate = 45;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [settings, games, statuses, live, announcements, topScores] = await Promise.all([
    getSiteSettings(),
    getGames({ limit: 60 }),
    getServiceStatus(),
    getLiveStats(),
    getAnnouncements(),
    getGlobalTopScores(8),
  ]);

  const featured = games.filter((g) => g.featured).slice(0, 6);
  const trending = [...games].sort((a, b) => b.players_online - a.players_online);
  const instant = games.filter((g) => g.play_mode === 'native');

  return (
    <>
      <AnnouncementBar announcements={announcements} />
      <Hero games={games} live={live} statuses={statuses} />
      <LiveMarquee games={trending.slice(0, 12)} />
      <FeaturedRail games={featured} />
      <StatsBand stats={settings.stats} live={live} />
      <TrendingLists trending={trending} instant={instant} />
      <GenreGrid games={games} />
      <HowItWorks />
      <Technology />
      <RegionsStrip statuses={statuses} />
      <LeaderboardTeaser scores={topScores} />
      <PricingTeaser />
      <Voices />
      <FinalCta site={settings.site} />
    </>
  );
}
