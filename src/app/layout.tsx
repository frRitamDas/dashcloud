import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { SiteBackground } from '@/components/layout/SiteBackground';
import { getSiteSettings } from '@/lib/queries';

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dashcloud.vercel.app'),
    title: {
      default: `${site.fullName} — ${site.tagline}`,
      template: `%s · ${site.name}`,
    },
    description: site.description,
    applicationName: site.fullName,
    authors: [{ name: 'Ritam Das', url: 'https://github.com/frRitamDas' }],
    creator: 'Ritam Das',
    publisher: 'Dash',
    keywords: ['cloud gaming', 'play games in browser', 'free cloud gaming', 'game streaming', 'Dash'],
    openGraph: {
      type: 'website',
      siteName: site.fullName,
      title: `${site.fullName} — ${site.tagline}`,
      description: site.description,
      images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Dash logo' }],
    },
    twitter: {
      card: 'summary',
      title: `${site.fullName}`,
      description: site.description,
    },
    icons: { icon: '/logo.png', apple: '/logo.png', shortcut: '/logo.png' },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <Providers>
          <SiteBackground />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
          >
            Skip to content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
