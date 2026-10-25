import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { IconArrowRight } from '@/components/ui/Icons';
import type { SiteSettings } from '@/lib/supabase/types';

const columns = [
  { title: 'Play', links: [
    { href: '/games', label: 'Discover games' },
    { href: '/games?mode=native', label: 'Instant play' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/pricing', label: 'Plans and coins' },
  ] },
  { title: 'Platform', links: [
    { href: '/status', label: 'Service status' },
    { href: '/about', label: 'About Dash' },
    { href: '/support', label: 'Support centre' },
  ] },
  { title: 'Legal', links: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ] },
];

export function Footer({ site }: { site: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/15 bg-[#080808]">
      <div className="section py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link href="/" aria-label="Dash Cloud home" className="inline-flex"><Logo size={34} /></Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">{site.description || 'A straightforward place to discover and play supported browser games.'}</p>
            <Link href="/games" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-neutral-700 underline-offset-4 transition-colors hover:decoration-white">
              Browse the catalogue <IconArrowRight width={15} height={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="text-sm text-neutral-400 transition-colors hover:text-white">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.fullName || 'Dash Cloud'}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/profile" className="transition-colors hover:text-neutral-300">My account</Link>
            <Link href="/admin" className="transition-colors hover:text-neutral-300">Administration</Link>
            <span>{site.credits}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
