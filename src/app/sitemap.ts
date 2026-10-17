import type { MetadataRoute } from 'next';
import { getGames } from '@/lib/queries';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://dashcloud.vercel.app';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getGames({ limit: 100 }).catch(() => []);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/games`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/status`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const gameRoutes: MetadataRoute.Sitemap = games.map((g) => ({
    url: `${base}/games/${g.slug}`,
    lastModified: g.updated_at ? new Date(g.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const playRoutes: MetadataRoute.Sitemap = games
    .filter((g) => g.status === 'live')
    .map((g) => ({ url: `${base}/play/${g.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 }));

  return [...staticRoutes, ...gameRoutes, ...playRoutes];
}
