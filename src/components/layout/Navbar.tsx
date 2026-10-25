'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { UserMenu } from './UserMenu';
import { CommandPalette } from './CommandPalette';
import { IconClose, IconMenu, IconSearch, IconArrowRight } from '@/components/ui/Icons';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

const primaryLinks = [
  { href: '/games', label: 'Discover' },
  { href: '/games?mode=native', label: 'Instant play' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

const utilityLinks = [
  { href: '/status', label: 'Status' },
  { href: '/support', label: 'Support' },
];

function isActive(pathname: string, href: string) {
  const path = href.split('?')[0];
  return pathname === path || pathname.startsWith(path + '/');
}

export function Navbar() {
  const pathname = usePathname();
  const { profile, user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navLinkClass = (active: boolean) => cn(
    'inline-flex h-9 items-center border-b-2 px-3 text-[13px] font-semibold transition-colors duration-150',
    active ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-white',
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[#080808]">
        <nav className="section flex h-16 items-center justify-between gap-4" aria-label="Main navigation">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="shrink-0" aria-label="Dash Cloud home">
              <span className="sm:hidden"><LogoMark size={30} /></span>
              <span className="hidden sm:block"><Logo size={31} /></span>
            </Link>
            <div className="hidden h-16 items-center gap-1 lg:flex">
              {primaryLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} className={navLinkClass(active)}>{link.label}</Link>;
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-4 xl:flex">
              {utilityLinks.map((link) => <Link key={link.href} href={link.href} className="text-xs font-medium text-neutral-500 transition-colors hover:text-white">{link.label}</Link>)}
            </div>
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Search games" className="inline-flex h-9 items-center gap-2 border border-white/15 px-2.5 text-sm text-neutral-400 transition-colors hover:border-white/40 hover:text-white sm:px-3">
              <IconSearch width={15} height={15} /><span className="hidden sm:inline">Search</span><kbd className="hidden border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 md:inline">⌘K</kbd>
            </button>
            {profile ? <UserMenu profile={profile} email={user?.email ?? null} /> : (
              <div className="hidden items-center gap-3 sm:flex">
                <Link href="/login" className="px-2 py-2 text-[13px] font-semibold text-neutral-300 transition-colors hover:text-white">Sign in</Link>
                <Link href="/signup" className="inline-flex h-9 items-center gap-2 bg-white px-3.5 text-[13px] font-bold text-black transition-colors hover:bg-neutral-200">Create account <IconArrowRight width={14} height={14} /></Link>
              </div>
            )}
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center border border-white/15 text-white transition-colors hover:bg-white/5 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation">
              {menuOpen ? <IconClose width={17} height={17} /> : <IconMenu width={17} height={17} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div id="mobile-navigation" className="border-t border-white/10 bg-[#080808] lg:hidden">
            <div className="section py-4">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-600">Explore</p>
              <div className="grid gap-1">
                {primaryLinks.map((link) => {
                  const active = isActive(pathname, link.href);
                  return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center justify-between px-3 text-sm font-semibold transition-colors', active ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/5 hover:text-white')}>{link.label}<IconArrowRight width={15} height={15} /></Link>;
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                {utilityLinks.map((link) => <Link key={link.href} href={link.href} className="px-2 py-2 text-sm font-medium text-neutral-400 hover:text-white">{link.label}</Link>)}
              </div>
              {!profile && <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login" className="btn-outline">Sign in</Link><Link href="/signup" className="btn-primary">Create account</Link></div>}
            </div>
          </div>
        )}
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
