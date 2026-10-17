'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { IconActivity, IconChevronRight, IconClose, IconGamepad, IconGlobe, IconLayers, IconSearch, IconServer, IconShield, IconTrophy, IconUser } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
  accent?: string;
}

const staticItems: PaletteItem[] = [
  { id: 'nav-games', label: 'Game library', hint: 'Browse all titles', href: '/games', icon: <IconGamepad width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-playable', label: 'Playable instantly', hint: 'No queue, no install', href: '/games?mode=native', icon: <IconLayers width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-leaderboard', label: 'Leaderboards', href: '/leaderboard', icon: <IconTrophy width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-status', label: 'Server status', href: '/status', icon: <IconServer width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-pricing', label: 'Plans & pricing', href: '/pricing', icon: <IconGlobe width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-profile', label: 'My profile', href: '/profile', icon: <IconUser width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-support', label: 'Support', href: '/support', icon: <IconShield width={16} height={16} />, group: 'Navigate' },
  { id: 'nav-activity', label: 'How streaming works', href: '/#how-it-works', icon: <IconActivity width={16} height={16} />, group: 'Navigate' },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setGames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = (await res.json()) as { games: Game[] };
        setGames(data.games ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [query, open]);

  const items = useMemo<PaletteItem[]>(() => {
    const term = query.trim().toLowerCase();
    const gameItems: PaletteItem[] = games.map((g) => ({
      id: `game-${g.id}`,
      label: g.title,
      hint: `${g.genre} · ${g.play_mode === 'native' ? 'play instantly' : 'cloud stream'}`,
      href: `/games/${g.slug}`,
      icon: <IconGamepad width={16} height={16} />,
      group: 'Games',
      accent: g.accent,
    }));
    const navItems = term
      ? staticItems.filter((i) => i.label.toLowerCase().includes(term) || (i.hint ?? '').toLowerCase().includes(term))
      : staticItems;
    return [...gameItems, ...navItems];
  }, [games, query]);

  useEffect(() => {
    setCursor(0);
  }, [items.length, query]);

  const go = useCallback(
    (item: PaletteItem) => {
      onClose();
      if (item.href.startsWith('#')) {
        router.push(item.href);
        return;
      }
      router.push(item.href);
    },
    [onClose, router],
  );

  const groups = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    items.forEach((i) => {
      const list = map.get(i.group) ?? [];
      list.push(i);
      map.set(i.group, list);
    });
    return Array.from(map.entries());
  }, [items]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] sm:p-8 sm:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[5px]" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            className="panel relative z-10 w-full max-w-[620px] overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
              <IconSearch width={17} height={17} className="shrink-0 text-[color:var(--text-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCursor((c) => Math.min(c + 1, items.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCursor((c) => Math.max(c - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const item = items[cursor];
                    if (item) go(item);
                  }
                }}
                placeholder="Search games or jump to a page…"
                className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-[color:var(--text-faint)]"
              />
              <button onClick={onClose} className="rounded-md p-1 text-[color:var(--text-faint)] hover:bg-white/[0.06] hover:text-white" aria-label="Close search">
                <IconClose width={15} height={15} />
              </button>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto px-2 py-2">
              {loading && <div className="px-3 py-6 text-center text-[12.5px] text-[color:var(--text-faint)]">Searching the catalogue…</div>}
              {!loading && items.length === 0 && (
                <div className="px-3 py-8 text-center text-[12.5px] text-[color:var(--text-faint)]">
                  No matches for “{query}”. Try “race”, “voxel” or “status”.
                </div>
              )}
              {!loading &&
                groups.map(([group, list]) => (
                  <div key={group} className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">{group}</div>
                    {list.map((item) => {
                      flatIndex += 1;
                      const active = flatIndex === cursor;
                      const index = flatIndex;
                      return (
                        <button
                          key={item.id}
                          onMouseEnter={() => setCursor(index)}
                          onClick={() => go(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                            active ? 'bg-white/[0.075]' : 'hover:bg-white/[0.04]',
                          )}
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08]"
                            style={{ background: item.accent ? `${item.accent}1f` : 'rgba(255,255,255,0.04)', color: item.accent ?? 'var(--text-dim)' }}
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-white">{item.label}</span>
                            {item.hint && <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">{item.hint}</span>}
                          </span>
                          <IconChevronRight width={14} height={14} className={cn('shrink-0 transition-opacity', active ? 'text-white/70 opacity-100' : 'opacity-0')} />
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-black/25 px-4 py-2.5 text-[10.5px] text-[color:var(--text-faint)]">
              <span className="flex items-center gap-3">
                <span className="rounded border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono">↑↓</span> navigate
                <span className="rounded border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono">↵</span> open
              </span>
              <span className="rounded border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono">esc</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
