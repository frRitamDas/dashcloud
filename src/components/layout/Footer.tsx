import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { IconArrowRight, IconIndia, IconShield } from '@/components/ui/Icons';
import type { SiteSettings } from '@/lib/supabase/types';

const columns = [
  {
    title: 'Platform',
    links: [
      { href: '/games', label: 'Game library' },
      { href: '/games?mode=native', label: 'Play instantly' },
      { href: '/leaderboard', label: 'Leaderboards' },
      { href: '/pricing', label: 'Plans & Dash Coins' },
    ],
  },
  {
    title: 'Network',
    links: [
      { href: '/status', label: 'Server status' },
      { href: '/status#regions', label: 'Cloud regions' },
      { href: '/#how-it-works', label: 'How streaming works' },
      { href: '/#technology', label: 'Technology' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Dash' },
      { href: '/support', label: 'Support' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function Footer({ site }: { site: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-white/[0.07] bg-[rgba(6,7,12,0.6)]">
      <div className="section py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo size={40} />
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-[color:var(--text-dim)]">
              {site.description}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[11.5px] font-medium text-[color:var(--text-dim)]">
                <IconShield width={14} height={14} className="text-neon-mint" />
                Hardened with RLS, CSP & signed admin sessions
              </span>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[11.5px] font-medium text-[color:var(--text-dim)]">
                <IconIndia width={14} height={14} className="text-neon-cyan" />
                Built in India · Mumbai edge node live
              </span>
            </div>

            <Link href="/signup" className="btn-primary mt-7 w-fit">
              Start playing free
              <IconArrowRight width={16} height={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-[13.5px] text-[color:var(--text-dim)] transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">Staff</h4>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/admin" className="text-[13.5px] text-[color:var(--text-dim)] transition-colors hover:text-white">
                    Admin panel
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-[13.5px] text-[color:var(--text-dim)] transition-colors hover:text-white">
                    My account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[color:var(--text-faint)]">
            © {year} {site.fullName}. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-[12.5px] text-[color:var(--text-dim)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-rose" />
            {site.credits}
          </p>
        </div>
      </div>
    </footer>
  );
}
