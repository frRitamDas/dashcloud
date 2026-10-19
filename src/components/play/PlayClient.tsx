'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Game, ServiceStatus } from '@/lib/supabase/types';
import { ENGINES, getEngine } from '@/components/games/registry';
import type { Quality } from '@/components/games/types';
import { BootSequence, type BootResult } from './BootSequence';
import { GameArt } from '@/components/art/GameArt';
import { setMuted } from '@/lib/sfx';
import { formatClock, withAlpha } from '@/lib/utils';
import {
  IconBolt,
  IconClose,
  IconExpand,
  IconGlobe,
  IconInfo,
  IconMute,
  IconPause,
  IconPlay,
  IconServer,
  IconSettings,
  IconVolume,
  IconWifi,
} from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type Phase = 'boot' | 'live' | 'unavailable' | 'ended';

export function PlayClient({
  game,
  statuses,
  playerName,
  alternatives,
}: {
  game: Game;
  statuses: ServiceStatus[];
  playerName: string;
  alternatives: Game[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [phase, setPhase] = useState<Phase>('boot');
  const [boot, setBoot] = useState<BootResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [quality, setQuality] = useState<Quality>('high');
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ping, setPing] = useState(0);
  const [telemetry, setTelemetry] = useState<{ fps?: number; detail?: string }>({});
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const sessionId = useRef<string | null>(null);
  const guestId = useRef<string>('');
  const stageRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number>(0);
  const lastScoreAt = useRef<number>(0);
  const endedRef = useRef(false);

  const engine = useMemo(() => getEngine(game.engine_key), [game.engine_key]);
  const canStream = game.play_mode === 'cloud' && Boolean(game.stream_url);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('dash_guest_id') : null;
    guestId.current = stored ?? `g_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    if (typeof window !== 'undefined' && !stored) window.localStorage.setItem('dash_guest_id', guestId.current);
  }, []);

  const endSession = useCallback(
    async (reason: 'exit' | 'unmount' = 'exit') => {
      if (endedRef.current) return;
      endedRef.current = true;
      const duration = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
      const payload = { sessionId: sessionId.current, guestId: guestId.current || undefined, durationSeconds: duration, status: 'ended' as const };
      try {
        if (reason === 'unmount' && navigator.sendBeacon && sessionId.current) {
          navigator.sendBeacon('/api/session', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        } else if (sessionId.current) {
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, end: true }),
          });
          if (res.ok) {
            const data = (await res.json()) as { xpGain?: number; coinGain?: number };
            if (data.xpGain) push(`+${data.xpGain} XP · +${data.coinGain ?? 0} Dash Coins earned`, 'success');
          }
        }
      } catch {
        /* network hiccup — session will be reaped server-side */
      }
      setPhase('ended');
    },
    [push],
  );

  // start the session record as soon as the launch begins
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: game.slug, region: 'auto', resolution: game.cloud_tier === 'ultra' ? '2160p60' : '1080p60', guestId: guestId.current }),
        });
        const data = (await res.json()) as { session?: { id: string }; error?: string };
        if (!cancelled && data.session) sessionId.current = data.session.id;
      } catch {
        /* guest telemetry is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game.slug, game.cloud_tier]);

  // flush session time if the tab is closed mid-session
  useEffect(() => {
    const onUnload = () => void endSession('unmount');
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('pagehide', onUnload);
      if (startedAt.current && !endedRef.current) void endSession('unmount');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBootComplete = useCallback(
    (result: BootResult) => {
      setBoot(result);
      setPing(result.latency);
      startedAt.current = Date.now();
      if (game.status === 'maintenance') {
        setPhase('unavailable');
        return;
      }
      if (game.play_mode === 'native' && engine) setPhase('live');
      else if (canStream) setPhase('live');
      else setPhase('unavailable');
      if (sessionId.current) {
        void fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streaming: true, sessionId: sessionId.current, guestId: guestId.current || undefined, latencyMs: result.latency, resolution: result.resolution, region: result.region?.region ?? 'auto' }),
        });
      }
    },
    [canStream, engine, game.play_mode, game.status],
  );

  // session timer + ping jitter
  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
      const base = boot?.latency ?? 18;
      setPing(Math.max(4, Math.round(base + (Math.random() - 0.5) * base * 0.35)));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, boot]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== 'live') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape' && !document.fullscreenElement) setPaused((p) => !p);
      if (e.key.toLowerCase() === 'm') {
        setMutedState((m) => {
          setMuted(!m);
          return !m;
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  const submitScore = useCallback(
    async (score: number, metric?: string, payload?: Record<string, string | number | boolean>) => {
      if (!score || score <= 0) return;
      const now = Date.now();
      if (now - lastScoreAt.current < 3000 && scoreSubmitted) return;
      lastScoreAt.current = now;
      setScoreSubmitted(true);
      try {
        await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: game.slug, score, metric: metric ?? engine?.meta.metric ?? 'points', payload, guestName: playerName }),
        });
      } catch {
        /* leaderboard submit is best-effort */
      }
    },
    [engine, game.slug, playerName, scoreSubmitted],
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      push('Fullscreen was blocked by the browser.', 'error');
    }
  }, [push]);

  const exit = useCallback(async () => {
    await endSession('exit');
    router.push(`/games/${game.slug}`);
    router.refresh();
  }, [endSession, game.slug, router]);

  const EngineComponent = engine?.Component;

  return (
    <div className="relative flex h-[calc(100dvh-64px)] w-full flex-col overflow-hidden bg-[#05060a]">
      {/* ---------- stage ---------- */}
      <div ref={stageRef} className="relative flex-1 overflow-hidden bg-[#07080f]">
        <AnimatePresence mode="wait">
          {phase === 'boot' && (
            <motion.div key="boot" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.01 }} transition={{ duration: 0.3 }}>
              <BootSequence game={game} statuses={statuses} onComplete={onBootComplete} onCancel={() => router.push(`/games/${game.slug}`)} />
            </motion.div>
          )}

          {phase === 'live' && (
            <motion.div key="live" className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              {EngineComponent ? (
                <EngineComponent
                  onScore={submitScore}
                  onTelemetry={setTelemetry}
                  paused={paused}
                  quality={quality}
                  muted={muted}
                  accent={game.accent}
                  playerName={playerName}
                />
              ) : (
                <iframe
                  src={game.stream_url ?? ''}
                  title={`${game.title} cloud stream`}
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; gamepad; xr-spatial-tracking; clipboard-write; encrypted-media"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
                />
              )}

              {/* pause veil */}
              <AnimatePresence>
                {paused && (
                  <motion.div
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d16]/95 p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,1)]">
                      <h3 className="text-[18px] font-semibold tracking-tight text-white">Session paused</h3>
                      <p className="mt-1 text-[12.5px] text-[color:var(--text-faint)]">
                        Cloud instance is warm — resume any time within 5 minutes and keep your place.
                      </p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button className="btn-primary" onClick={() => setPaused(false)}>
                          <IconPlay width={15} height={15} /> Resume
                        </button>
                        <button className="btn-ghost" onClick={() => setShowSettings((s) => !s)}>
                          <IconSettings width={15} height={15} /> Settings
                        </button>
                        <button className="btn-ghost" onClick={toggleFullscreen}>
                          <IconExpand width={15} height={15} /> Fullscreen
                        </button>
                        <button className="btn-danger" onClick={exit}>
                          <IconClose width={15} height={15} /> End session
                        </button>
                      </div>

                      <AnimatePresence>
                        {showSettings && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-5 space-y-4 border-t border-white/[0.07] pt-4">
                              <div>
                                <span className="label">Stream quality</span>
                                <div className="flex gap-1.5">
                                  {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                                    <button
                                      key={q}
                                      onClick={() => setQuality(q)}
                                      className={cn(
                                        'flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold capitalize transition-colors',
                                        quality === q ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/10 bg-white/[0.03] text-[color:var(--text-faint)] hover:text-white',
                                      )}
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="label !mb-0">Audio</span>
                                <button
                                  onClick={() => {
                                    setMutedState((m) => !m);
                                  }}
                                  className="btn-ghost !py-1.5 !text-[12px]"
                                >
                                  {muted ? <IconMute width={14} height={14} /> : <IconVolume width={14} height={14} />}
                                  {muted ? 'Muted' : 'On'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'unavailable' && (
            <motion.div key="unavailable" className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
              <StreamUnavailable game={game} alternatives={alternatives} onExit={() => router.push(`/games/${game.slug}`)} boot={boot} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- session bar ---------- */}
      {phase !== 'boot' && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-[#080a11] px-3 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: paused ? '#fbbf24' : '#4ade80' }} />
              {paused ? 'Paused' : 'Streaming'}
            </span>
            <Chip icon={<IconServer width={13} height={13} />} label={boot?.region?.region ?? 'Edge'} value={boot?.region?.gpu_pool ?? 'GPU'} />
            <Chip icon={<IconWifi width={13} height={13} />} label="Ping" value={`${ping} ms`} tone={ping < 30 ? 'good' : ping < 60 ? 'warn' : 'bad'} />
            <Chip icon={<IconBolt width={13} height={13} />} label="FPS" value={telemetry.fps ? String(telemetry.fps) : '—'} />
            <Chip icon={<IconGlobe width={13} height={13} />} label="Res" value={boot?.resolution ?? '1080p60'} />
            <span className="hidden font-mono text-[12px] tabular-nums text-white/60 lg:inline">{formatClock(elapsed)}</span>
            {telemetry.detail && <span className="hidden truncate text-[11.5px] text-[color:var(--text-faint)] xl:inline">{telemetry.detail}</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <IconBtn label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((p) => !p)}>
              {paused ? <IconPlay width={15} height={15} /> : <IconPause width={15} height={15} />}
            </IconBtn>
            <IconBtn label={muted ? 'Unmute' : 'Mute'} onClick={() => setMutedState((m) => !m)}>
              {muted ? <IconMute width={15} height={15} /> : <IconVolume width={15} height={15} />}
            </IconBtn>
            <IconBtn label="Settings" onClick={() => {
              setPaused(true);
              setShowSettings(true);
            }}>
              <IconSettings width={15} height={15} />
            </IconBtn>
            <IconBtn label="Fullscreen" onClick={toggleFullscreen}>
              <IconExpand width={15} height={15} />
            </IconBtn>
            <button onClick={exit} className="btn-ghost !py-1.5 !text-[12px]">
              <IconClose width={14} height={14} /> End session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const color = tone === 'good' ? '#4ade80' : tone === 'warn' ? '#fbbf24' : tone === 'bad' ? '#fb7185' : undefined;
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px]">
      <span className="text-[color:var(--text-faint)]">{icon}</span>
      <span className="text-[color:var(--text-faint)]">{label}</span>
      <span className="font-mono font-semibold tabular-nums" style={{ color: color ?? 'rgba(255,255,255,0.85)' }}>
        {value}
      </span>
    </span>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  );
}

function StreamUnavailable({
  game,
  alternatives,
  onExit,
  boot,
}: {
  game: Game;
  alternatives: Game[];
  onExit: () => void;
  boot: BootResult | null;
}) {
  return (
    <div className="relative flex min-h-full items-center justify-center p-5">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div
        className="absolute h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${withAlpha(game.accent, 0.22)}, transparent)` }}
      />
      <div className="relative w-full max-w-2xl">
        <div className="panel overflow-hidden rounded-2xl">
          <div className="flex items-start gap-4 border-b border-white/[0.07] p-5">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg">
              <GameArt slug={game.slug} title={game.title} genre={game.genre} accent={game.accent} coverUrl={game.cover_url} rounded={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[17px] font-semibold tracking-tight text-white">{game.title}</h2>
                <span className="chip !border-[rgba(251,191,36,0.3)] !bg-[rgba(251,191,36,0.1)] !text-[#fcd34d]">Stream endpoint required</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
                The cloud instance booted successfully{boot ? ` on ${boot.region?.region ?? 'the edge'} in ${boot.bootSeconds.toFixed(1)}s` : ''}, but this title has no
                licensed media source attached yet. Dash streams the video from a WebRTC endpoint you control — nothing is bundled or redistributed with the platform.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
                <IconInfo width={15} height={15} className="text-neon-cyan" /> Connect this title in under a minute
              </h3>
              <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                <li>
                  <span className="font-mono text-white/70">1.</span> Run the title on your own licensed cloud GPU / capture host (for example a WebRTC media
                  server you operate).
                </li>
                <li>
                  <span className="font-mono text-white/70">2.</span> Open <Link href="/admin" className="text-brand-300 underline decoration-brand-500/40 underline-offset-2">Admin panel → Games</Link>, edit{' '}
                  <span className="font-semibold text-white">{game.title}</span> and paste the player URL into <span className="font-mono text-white/70">stream_url</span>.
                </li>
                <li>
                  <span className="font-mono text-white/70">3.</span> Set status to <span className="font-semibold text-white">Live</span> and save. Every visitor gets the
                  stream instantly — no redeploy needed, changes propagate over Supabase realtime.
                </li>
              </ol>
            </div>

            {alternatives.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Playable right now, no setup</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {alternatives.slice(0, 4).map((alt) => (
                    <Link
                      key={alt.id}
                      href={`/play/${alt.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="h-11 w-9 shrink-0 overflow-hidden rounded-md">
                        <GameArt slug={alt.slug} title={alt.title} genre={alt.genre} accent={alt.accent} coverUrl={alt.cover_url} rounded={false} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-white">{alt.title}</span>
                        <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">{alt.tagline}</span>
                      </span>
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                        style={{ background: withAlpha(alt.accent, 0.16), color: alt.accent }}
                      >
                        <IconPlay width={13} height={13} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link href="/games?mode=native" className="btn-primary">
                Browse instant-play library
              </Link>
              <button onClick={onExit} className="btn-ghost">
                Back to {game.title}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
          Dash ships with {Object.keys(ENGINES).length} fully playable in-browser engines and a complete cloud-streaming pipeline. Third-party titles are streamed only
          from endpoints you are licensed to serve.
        </p>
      </div>
    </div>
  );
}
