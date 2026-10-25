'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { LivePill } from './LivePill';
import { UserMenu } from './UserMenu';
import { CommandPalette } from './CommandPalette';
import { IconClose, IconGamepad, IconMenu, IconSearch } from '@/components/ui/Icons';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

const links = [
  { href: '/games', label: 'Games' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/status', label: 'Status' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
];

export function Navbar() {
  const pathname = usePathname();
  const { profile, user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement | null)?.tagName ?? '')) {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[#080808]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#080808]/70">
        <nav className="section flex h-[64px] items-center justify-between gap-4" aria-label="Main navigation">
          <div className="flex min-w-0 items-center gap-9">
            <Link href="/" className="shrink-0" aria-label="Dash home">
              <span className="sm:hidden"><LogoMark size={32} /></span>
              <span className="hidden sm:block"><Logo size={32} /></span>
            </Link>
            <div className="hidden items-center gap-1 lg:flex">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                    className={cn('rounded-lg px-3 py-2 text-[13px] font-medium transition-colors', active ? 'bg-white text-black' : 'text-neutral-400 hover:bg-white/5 hover:text-white')}>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block"><LivePill /></div>
            <button onClick={() => setPaletteOpen(true)} aria-label="Search games" className="flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-neutral-400 hover:border-white/40 hover:text-white">
              <IconSearch width={15} height={15} /><span className="hidden sm:inline">Search</span><kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] md:inline">⌘K</kbd>
            </button>
            {profile ? <UserMenu profile={profile} email={user?.email ?? null} /> : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="rounded-lg px-3 py-2 text-[13px] font-semibold text-neutral-300 hover:bg-white/5 hover:text-white">Sign in</Link>
                <Link href="/signup" className="btn-primary !py-2 !text-[13px]"><IconGamepad width={15} height={15} />Start playing</Link>
              </div>
            )}
            <button onClick={() => setMenuOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
              {menuOpen ? <IconClose width={17} height={17} /> : <IconMenu width={17} height={17} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#080808] lg:hidden">
            <div className="section flex flex-col gap-1 py-4">
              <div className="mb-2"><LivePill /></div>
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} className={cn('flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium', active ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/5')}>{link.label}<span>↗</span></Link>;
              })}
              {!profile && <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login" className="btn-outline">Sign in</Link><Link href="/signup" className="btn-primary">Start playing</Link></div>}
            </div>
          </div>
        )}
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
