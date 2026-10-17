'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Game, LiveStats, ServiceStatus } from '@/lib/supabase/types';
import { GameArt } from '@/components/art/GameArt';
import { IconArrowRight, IconBolt, IconPlay, IconServer, IconShield, IconWifi } from '@/components/ui/Icons';
import { formatNumber, withAlpha } from '@/lib/utils';

export function Hero({ games, live, statuses }: { games: Game[]; live: LiveStats; statuses: ServiceStatus[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 90, damping: 20, mass: 0.5 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [9, -9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-6, 6]);
  const floatA = useTransform(sy, [-0.5, 0.5], [16, -16]);
  const floatB = useTransform(sx, [-0.5, 0.5], [-14, 14]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [mx, my]);

  const featured = games.filter((g) => g.featured).slice(0, 4);
  const [pingIndex, setPingIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPingIndex((i) => (i + 1) % Math.max(1, statuses.length)), 2600);
    return () => clearInterval(id);
  }, [statuses.length]);
  const active = statuses[pingIndex];

  return (
    <section ref={ref} className="relative overflow-hidden pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="section grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* ---------- copy ---------- */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.035] py-1.5 pl-1.5 pr-3.5 backdrop-blur-md"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-[rgba(74,222,128,0.14)] px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.12em] text-[#86efac]">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#4ade80]" />
              Free forever
            </span>
            <span className="text-[12.5px] font-medium text-white/70">
              <span className="font-mono tabular-nums text-white">{formatNumber(live.playersOnline)}</span> playing right now
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="h-display mt-6 text-[42px] leading-[1.02] sm:text-[58px] lg:text-[68px]"
          >
            Play anything.
            <br />
            <span className="bg-gradient-to-r from-white via-white to-white/45 bg-clip-text text-transparent">Anywhere.</span>{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(100deg,#7c83ff 0%,#22d3ee 55%,#4ade80 100%)' }}
            >
              Instantly.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-[color:var(--text-dim)] sm:text-[16.5px]"
          >
            Dash is a free cloud gaming service. Heavyweight titles run on our GPU nodes and stream straight into your
            browser — no downloads, no installs, no 90 GB patch, no expensive hardware. A phone, a laptop or a ten-year-old
            PC is enough.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/games?mode=native" className="btn-primary !px-6 !py-3.5 !text-[15px] !rounded-2xl">
              <IconPlay width={17} height={17} />
              Play instantly — free
            </Link>
            <Link href="/games" className="btn-outline !px-5 !py-3.5 !text-[14.5px] !rounded-2xl">
              Browse {games.length} titles
              <IconArrowRight width={16} height={16} />
            </Link>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
          >
            {[
              { icon: <IconBolt width={14} height={14} />, label: 'Avg boot', value: '9s' },
              { icon: <IconWifi width={14} height={14} />, label: 'Avg ping', value: `${live.avgLatency || 18}ms` },
              { icon: <IconServer width={14} height={14} />, label: 'GPU regions', value: String(new Set(statuses.map((s) => s.region)).size) },
              { icon: <IconShield width={14} height={14} />, label: 'Uptime', value: '99.98%' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                  {stat.icon}
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-[22px] font-bold tabular-nums text-white">{stat.value}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ---------- floating stream preview ---------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[520px]"
          style={{ perspective: 1200 }}
        >
          <motion.div
            style={{ rotateY, rotateX, transformStyle: 'preserve-3d' }}
            className="relative aspect-[4/3.35] w-full"
          >
            {/* main stream card */}
            <div
              className="absolute inset-x-[8%] inset-y-[6%] overflow-hidden rounded-2xl border border-white/[0.09] shadow-[0_50px_120px_-40px_rgba(0,0,0,1)]"
              style={{ transform: 'translateZ(40px)' }}
            >
              {featured[0] && <GameArt slug={featured[0].slug} title={featured[0].title} genre={featured[0].genre} accent={featured[0].accent} coverUrl={featured[0].cover_url} rounded={false} />}
              <div className="absolute inset-0 scanline opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86efac] backdrop-blur-md">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#4ade80]" /> Live stream
                </span>
                <span className="rounded-full border border-white/12 bg-black/50 px-2.5 py-1 font-mono text-[10.5px] tabular-nums text-white/80 backdrop-blur-md">
                  {active ? `${active.region_code} · ${active.latency_ms}ms` : '1080p60'}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Now streaming</p>
                <h3 className="mt-1 truncate text-[19px] font-semibold tracking-tight text-white">{featured[0]?.title ?? 'Dash'}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={featured[0] ? `/play/${featured[0].slug}` : '/games'}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold text-black transition-transform duration-200 hover:scale-[1.03]"
                    style={{ background: featured[0]?.accent ?? '#6d5cff' }}
                  >
                    <IconPlay width={12} height={12} /> Play now
                  </Link>
                  <span className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-2 text-[11px] font-medium text-white/65 backdrop-blur-md">
                    {featured[0] ? formatNumber(featured[0].players_online) : '0'} in game
                  </span>
                </div>
              </div>
            </div>

            {/* secondary floating cards */}
            {featured.slice(1, 3).map((g, i) => (
              <motion.div
                key={g.id}
                style={{ y: i === 0 ? floatA : floatB, transformStyle: 'preserve-3d' }}
                className={`absolute h-[46%] w-[34%] overflow-hidden rounded-xl border border-white/[0.09] shadow-[0_30px_70px_-30px_rgba(0,0,0,1)] ${
                  i === 0 ? '-left-[4%] top-[16%]' : '-right-[5%] bottom-[14%]'
                }`}
              >
                <GameArt slug={g.slug} title={g.title} genre={g.genre} accent={g.accent} coverUrl={g.cover_url} rounded={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <p className="absolute inset-x-0 bottom-0 truncate p-2 text-[11px] font-semibold text-white/90">{g.title}</p>
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: g.accent, boxShadow: `0 0 10px ${withAlpha(g.accent, 0.9)}` }}
                />
              </motion.div>
            ))}

            {/* latency card */}
            <motion.div
              style={{ y: floatB, transformStyle: 'preserve-3d' }}
              className="absolute -bottom-[3%] left-[10%] flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-[rgba(9,11,19,0.9)] px-3 py-2.5 shadow-lift backdrop-blur-xl"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.14)] text-[#86efac]">
                <IconWifi width={14} height={14} />
              </span>
              <span>
                <span className="block font-mono text-[13px] font-bold tabular-nums text-white">{active?.latency_ms ?? 18} ms</span>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                  {active?.region ?? 'Mumbai'} edge
                </span>
              </span>
            </motion.div>

            <motion.div
              style={{ y: floatA, transformStyle: 'preserve-3d' }}
              className="absolute -top-[2%] right-[6%] flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-[rgba(9,11,19,0.9)] px-3 py-2.5 shadow-lift backdrop-blur-xl"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(109,92,255,0.16)] text-brand-200">
                <IconBolt width={14} height={14} />
              </span>
              <span>
                <span className="block font-mono text-[13px] font-bold tabular-nums text-white">{live.gamesLive}</span>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">titles live</span>
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
