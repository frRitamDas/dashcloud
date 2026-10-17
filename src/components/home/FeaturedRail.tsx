'use client';

import { motion, useAnimation } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game } from '@/lib/supabase/types';
import { GameArt } from '@/components/art/GameArt';
import { IconChevronRight, IconPlay, IconStar, IconUsers } from '@/components/ui/Icons';
import { formatNumber, withAlpha } from '@/lib/utils';

export function FeaturedRail({ games }: { games: Game[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const controls = useAnimation();

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
    setIndex(i);
    controls.start({ scale: [1, 1.008, 1] });
  }, [controls]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      setIndex((prev) => {
        const next = (prev + 1) % games.length;
        const track = trackRef.current;
        const card = track?.children[next] as HTMLElement | undefined;
        if (track && card) track.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
        return next;
      });
    }, 6500);
    return () => clearInterval(id);
  }, [games.length]);

  if (!games.length) return null;

  return (
    <section className="relative py-16 lg:py-20">
      <div className="section">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="kicker">Featured on Dash</span>
            <h2 className="h-display mt-2 text-[30px] sm:text-[38px]">Hand-picked, streaming now</h2>
            <p className="mt-2 max-w-xl text-[14px] text-[color:var(--text-dim)]">
              Spotlighted titles our community keeps coming back to. Every one boots on a cloud node in seconds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollTo(Math.max(0, index - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
              disabled={index === 0}
              aria-label="Previous featured game"
            >
              <IconChevronRight width={16} height={16} className="rotate-180" />
            </button>
            <button
              onClick={() => scrollTo(Math.min(games.length - 1, index + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
              disabled={index >= games.length - 1}
              aria-label="Next featured game"
            >
              <IconChevronRight width={16} height={16} />
            </button>
            <Link href="/games" className="btn-ghost ml-1 hidden sm:inline-flex">
              All games <IconChevronRight width={15} height={15} />
            </Link>
          </div>
        </div>
      </div>

      <motion.div animate={controls}>
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 sm:px-8"
        >
          {games.map((g, i) => (
            <article
              key={g.id}
              className="relative w-[86vw] shrink-0 snap-start sm:w-[520px] lg:w-[600px]"
              aria-hidden={i !== index}
            >
              <Link href={`/games/${g.slug}`} className="group block">
                <div className="card-hover relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08]">
                  <div className="absolute inset-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
                    <GameArt slug={g.slug} title={g.title} genre={g.genre} accent={g.accent} coverUrl={g.banner_url ?? g.cover_url} rounded={false} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-md"
                        style={{ borderColor: withAlpha(g.accent, 0.4), background: withAlpha(g.accent, 0.16), color: g.accent }}
                      >
                        {g.play_mode === 'native' ? 'Instant play' : `Cloud ${g.cloud_tier}`}
                      </span>
                      <span className="rounded-full border border-white/12 bg-black/40 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65 backdrop-blur-md">
                        {g.genre}
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-white/12 bg-black/40 px-2.5 py-[3px] text-[10.5px] font-semibold text-white/70 backdrop-blur-md">
                        <IconStar width={10} height={10} className="text-[#fbbf24]" />
                        <span className="font-mono tabular-nums">{g.rating.toFixed(1)}</span>
                      </span>
                    </div>

                    <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-white sm:text-[30px]">{g.title}</h3>
                    <p className="mt-1.5 line-clamp-2 max-w-md text-[13px] leading-relaxed text-white/60">{g.tagline}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold text-black transition-transform duration-200 group-hover:scale-[1.04]"
                        style={{ background: g.accent }}
                      >
                        <IconPlay width={13} height={13} /> {g.status === 'soon' ? 'View details' : 'Launch'}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-white/55">
                        <IconUsers width={13} height={13} />
                        <span className="font-mono tabular-nums">{formatNumber(g.players_online)}</span> playing
                      </span>
                      {g.publisher && <span className="text-[12px] text-white/40">{g.publisher}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </motion.div>

      <div className="section mt-5 flex items-center gap-1.5">
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => scrollTo(i)}
            aria-label={`Show ${g.title}`}
            className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-white' : 'w-3 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
}
