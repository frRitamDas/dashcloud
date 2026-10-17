'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { IconChevronDown, IconCoins, IconHeart, IconLock, IconLogout, IconSettings, IconUser } from '@/components/ui/Icons';
import { formatNumber, initials, xpProgress } from '@/lib/utils';

export function UserMenu({ profile, email }: { profile: Profile | null; email?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const name = profile?.display_name || profile?.username || email?.split('@')[0] || 'Player';
  const progress = xpProgress(profile?.xp ?? 0);

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-[11px] font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden max-w-[92px] truncate text-[13px] font-semibold text-white sm:block">{name}</span>
        <IconChevronDown width={14} height={14} className={`text-[color:var(--text-faint)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="panel absolute right-0 z-50 mt-2 w-[268px] origin-top-right overflow-hidden rounded-xl"
            role="menu"
          >
            <div className="border-b border-white/[0.07] px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-white">{name}</p>
                  <p className="truncate text-[11.5px] text-[color:var(--text-faint)]">{email ?? 'Guest player'}</p>
                </div>
                <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 font-mono text-[10.5px] font-bold text-brand-200">
                  LV {profile?.level ?? 1}
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10.5px] text-[color:var(--text-faint)]">
                  <span>XP progress</span>
                  <span className="font-mono tabular-nums">{progress.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-neon-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11.5px] text-[color:var(--text-dim)]">
                <span className="flex items-center gap-1.5">
                  <IconCoins width={14} height={14} className="text-neon-amber" />
                  <span className="font-mono tabular-nums">{formatNumber(profile?.coins ?? 0)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUser width={14} height={14} />
                  <span className="font-mono tabular-nums">{profile?.games_played ?? 0} games</span>
                </span>
              </div>
            </div>

            <div className="p-1.5">
              {[
                { href: '/profile', label: 'My profile', icon: <IconUser width={15} height={15} /> },
                { href: '/profile?tab=library', label: 'Library & favourites', icon: <IconHeart width={15} height={15} /> },
                { href: '/profile?tab=settings', label: 'Account settings', icon: <IconSettings width={15} height={15} /> },
                { href: '/admin', label: 'Admin panel', icon: <IconLock width={15} height={15} /> },
              ].map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[color:var(--text-dim)] transition-colors hover:bg-white/[0.06] hover:text-white"
                  role="menuitem"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-white/[0.07] p-1.5">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#fda4af] transition-colors hover:bg-[rgba(251,113,133,0.1)]"
                role="menuitem"
              >
                <IconLogout width={15} height={15} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
