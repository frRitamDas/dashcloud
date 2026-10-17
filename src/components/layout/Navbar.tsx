'use client';

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
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
  const email = user?.email ?? null;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const transparent = pathname === '/' && !scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-[80] transition-[background,backdrop-filter,border-color] duration-300',
          transparent || !scrolled
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-white/[0.07] bg-[rgba(6,7,12,0.72)] backdrop-blur-xl backdrop-saturate-150',
        )}
      >
        <nav className="section flex h-[64px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0" aria-label="Dash home">
              <span className="sm:hidden">
                <LogoMark size={34} />
              </span>
              <span className="hidden sm:block">
                <Logo size={34} />
              </span>
            </Link>

            <div className="hidden items-center gap-0.5 lg:flex">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      'relative rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                      active ? 'text-white' : 'text-[color:var(--text-dim)] hover:text-white',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg border border-white/[0.08] bg-white/[0.06]"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block">
              <LivePill />
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              className="group hidden items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-[12.5px] text-[color:var(--text-faint)] transition-colors hover:border-white/20 hover:text-white md:flex"
              aria-label="Search games"
            >
              <IconSearch width={15} height={15} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] lg:inline">⌘K</kbd>
            </button>

            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-[color:var(--text-dim)] md:hidden"
              aria-label="Search"
            >
              <IconSearch width={16} height={16} />
            </button>

            {profile ? (
              <UserMenu profile={profile} email={email} />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="btn-ghost !py-2 !text-[13px]">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary !py-2 !text-[13px]">
                  <IconGamepad width={15} height={15} />
                  Play free
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-white lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <IconClose width={17} height={17} /> : <IconMenu width={17} height={17} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/[0.07] bg-[rgba(6,7,12,0.96)] backdrop-blur-xl lg:hidden"
            >
              <div className="section flex flex-col gap-1 py-4">
                <div className="mb-2 flex xl:hidden">
                  <LivePill />
                </div>
                {links.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                    <Link
                      href={l.href}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3.5 py-3 text-[14.5px] font-medium transition-colors',
                        pathname === l.href ? 'bg-white/[0.07] text-white' : 'text-[color:var(--text-dim)] hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      {l.label}
                      <span className="text-[color:var(--text-faint)]">→</span>
                    </Link>
                  </motion.div>
                ))}
                {!profile && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href="/login" className="btn-ghost justify-center">
                      Sign in
                    </Link>
                    <Link href="/signup" className="btn-primary justify-center">
                      Play free
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
