'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { GameCard } from './GameCard';
import { IconClose, IconFilter, IconSearch } from '@/components/ui/Icons';
import { GameCardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

type Sort = 'popular' | 'rating' | 'newest' | 'az';

export function LibraryExplorer({ initialGames, genres }: { initialGames: Game[]; genres: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [genre, setGenre] = useState(params.get('genre') ?? 'all');
  const [mode, setMode] = useState<'all' | 'native' | 'cloud'>(
    params.get('mode') === 'native' ? 'native' : params.get('mode') === 'cloud' ? 'cloud' : 'all',
  );
  const [sort, setSort] = useState<Sort>((params.get('sort') as Sort) ?? 'popular');
  const [showFilters, setShowFilters] = useState(false);

  const query = useMemo(
    () => ({
      q: search.trim() || undefined,
      genre: genre !== 'all' ? genre : undefined,
      mode: mode !== 'all' ? mode : undefined,
      sort,
    }),
    [search, genre, mode, sort],
  );

  const fetchGames = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (query.q) sp.set('q', query.q);
    if (query.genre) sp.set('genre', query.genre);
    if (query.mode) sp.set('mode', query.mode);
    sp.set('sort', query.sort);
    sp.set('limit', '60');
    try {
      const res = await fetch(`/api/games?${sp.toString()}`);
      const data = (await res.json()) as { games: Game[] };
      setGames(data.games ?? []);
    } catch {
      /* keep the previous list on a network error */
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const id = setTimeout(fetchGames, search ? 220 : 0);
    return () => clearTimeout(id);
  }, [fetchGames, search]);

  // keep the URL shareable without triggering a full navigation
  useEffect(() => {
    const sp = new URLSearchParams();
    if (search) sp.set('q', search);
    if (genre !== 'all') sp.set('genre', genre);
    if (mode !== 'all') sp.set('mode', mode);
    if (sort !== 'popular') sp.set('sort', sort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [search, genre, mode, sort, pathname, router]);

  useEffect(() => {
    const nextSearch = params.get('q') ?? '';
    const nextGenre = params.get('genre') ?? 'all';
    const modeParam = params.get('mode');
    const nextMode: 'all' | 'native' | 'cloud' =
      modeParam === 'native' || modeParam === 'cloud' ? modeParam : 'all';
    const sortParam = params.get('sort');
    const nextSort: Sort = sortParam === 'rating' || sortParam === 'newest' || sortParam === 'az' ? sortParam : 'popular';

    setSearch(nextSearch);
    setGenre(nextGenre);
    setMode(nextMode);
    setSort(nextSort);
  }, [params]);

  const activeFilters = [
    search && { label: `“${search}”`, clear: () => setSearch('') },
    genre !== 'all' && { label: genre, clear: () => setGenre('all') },
    mode !== 'all' && { label: mode === 'native' ? 'Instant play' : 'Cloud stream', clear: () => setMode('all') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div>
      {/* ---------- control bar ---------- */}
      <div className="sticky top-[64px] z-30 -mx-5 mb-7 border-b border-white/[0.06] bg-[rgba(6,7,12,0.82)] px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[190px] flex-1">
            <IconSearch width={15} height={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 32 titles, genres, publishers…"
              className="input !pl-9"
              aria-label="Search games"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[color:var(--text-faint)] hover:text-white" aria-label="Clear search">
                <IconClose width={13} height={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn('btn-ghost !py-2.5 lg:hidden', showFilters && '!bg-white/[0.09] !text-white')}
            aria-expanded={showFilters}
          >
            <IconFilter width={15} height={15} /> Filters
          </button>

          <div className="hidden items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1 lg:flex">
            {(['all', 'native', 'cloud'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                  mode === m ? 'bg-white/[0.09] text-white' : 'text-[color:var(--text-faint)] hover:text-white/80',
                )}
              >
                {m === 'all' ? 'All' : m === 'native' ? 'Instant play' : 'Cloud stream'}
              </button>
            ))}
          </div>

          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !w-auto !py-2.5 !text-[12.5px]" aria-label="Sort games">
            <option value="popular">Most popular</option>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
            <option value="az">A – Z</option>
          </select>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-3">
                {(['all', 'native', 'cloud'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                      mode === m ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-[color:var(--text-faint)]',
                    )}
                  >
                    {m === 'all' ? 'All modes' : m === 'native' ? 'Instant play' : 'Cloud stream'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="no-scrollbar mt-2.5 hidden gap-1.5 overflow-x-auto lg:flex">
          <FilterChip active={genre === 'all'} onClick={() => setGenre('all')} label="All genres" />
          {genres.map((g) => (
            <FilterChip key={g} active={genre === g} onClick={() => setGenre(g)} label={g} />
          ))}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Active</span>
            {activeFilters.map((f) => (
              <button key={f.label} onClick={f.clear} className="chip !border-white/15 !text-white/80 hover:!bg-white/[0.09]">
                {f.label}
                <IconClose width={11} height={11} />
              </button>
            ))}
            <button
              onClick={() => {
                setSearch('');
                setGenre('all');
                setMode('all');
                setSort('popular');
              }}
              className="ml-1 text-[11.5px] text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200"
            >
              Reset all
            </button>
          </div>
        )}

        <div className="mt-2.5 no-scrollbar flex gap-1.5 overflow-x-auto lg:hidden">
          <FilterChip active={genre === 'all'} onClick={() => setGenre('all')} label="All" />
          {genres.map((g) => (
            <FilterChip key={g} active={genre === g} onClick={() => setGenre(g)} label={g} />
          ))}
        </div>
      </div>

      {/* ---------- results ---------- */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-[color:var(--text-faint)]">
          <span className="font-mono font-semibold text-white/80">{loading ? '…' : games.length}</span> title{games.length === 1 ? '' : 's'}
          {genre !== 'all' && ` in ${genre}`}
          {mode !== 'all' && ` · ${mode === 'native' ? 'instant play' : 'cloud stream'}`}
        </p>
        {loading && (
          <span className="flex items-center gap-2 text-[11.5px] text-[color:var(--text-faint)]">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-400" /> updating
          </span>
        )}
      </div>

      {games.length === 0 && !loading ? (
        <div className="panel flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <IconSearch width={22} height={22} className="text-[color:var(--text-faint)]" />
          </div>
          <h3 className="text-[16px] font-semibold text-white">No titles match those filters</h3>
          <p className="mt-1.5 max-w-sm text-[13px] text-[color:var(--text-dim)]">
            Try clearing the search, or browse the instant-play library which needs no queue at all.
          </p>
          <button
            className="btn-primary mt-5"
            onClick={() => {
              setSearch('');
              setGenre('all');
              setMode('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className={cn('grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', loading && 'opacity-60')}>
          {games.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} priority={g.featured} />
          ))}
        </div>
      )}

      {loading && games.length === 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium capitalize transition-colors',
        active ? 'border-[rgba(109,92,255,0.5)] bg-[rgba(109,92,255,0.16)] text-white' : 'border-white/[0.08] bg-white/[0.03] text-[color:var(--text-faint)] hover:border-white/20 hover:text-white/85',
      )}
    >
      {label}
    </button>
  );
}
