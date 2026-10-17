'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game, ServiceStatus } from '@/lib/supabase/types';
import { IconBolt, IconCheck, IconCpu, IconGlobe, IconServer, IconWifi } from '@/components/ui/Icons';
import { cn, withAlpha } from '@/lib/utils';

export interface BootResult {
  region: ServiceStatus | null;
  latency: number;
  resolution: string;
  bootSeconds: number;
}

interface Step {
  id: string;
  label: string;
  detail: string;
  ms: number;
  icon: React.ReactNode;
}

function pickRegion(statuses: ServiceStatus[]) {
  const candidates = statuses.filter((s) => s.status === 'operational' || s.status === 'degraded');
  if (!candidates.length) return statuses[0] ?? null;
  const ranked = [...candidates].sort((a, b) => a.latency_ms + a.load_percent * 0.4 - (b.latency_ms + b.load_percent * 0.4));
  // Prefer a healthy node but keep a little variety so repeat launches feel real.
  return ranked[Math.random() > 0.82 ? Math.min(1, ranked.length - 1) : 0] ?? null;
}

export function BootSequence({
  game,
  statuses,
  onComplete,
  onCancel,
}: {
  game: Game;
  statuses: ServiceStatus[];
  onComplete: (result: BootResult) => void;
  onCancel: () => void;
}) {
  const region = useMemo(() => pickRegion(statuses), [statuses]);
  const bootSeconds = useMemo(() => 6 + Math.round(Math.random() * 5), []);

  const steps: Step[] = useMemo(() => {
    const r = region?.region ?? 'Edge';
    return [
      { id: 'edge', label: 'Connecting to Dash edge', detail: `Nearest healthy node · ${r} (${region?.region_code ?? 'auto'})`, ms: 900, icon: <IconGlobe width={15} height={15} /> },
      { id: 'auth', label: 'Validating entitlement', detail: 'Free tier · unlimited standard sessions', ms: 700, icon: <IconCheck width={15} height={15} /> },
      { id: 'queue', label: 'Reserving cloud GPU', detail: `${region?.gpu_pool ?? 'GPU pool'} · queue position ${Math.max(1, Math.round((game.players_online % 7) + 1))}`, ms: 1500, icon: <IconServer width={15} height={15} /> },
      { id: 'boot', label: 'Booting stream container', detail: 'Ubuntu 24.04 LTS · Dash runtime v4.2', ms: 1300, icon: <IconCpu width={15} height={15} /> },
      { id: 'assets', label: 'Loading title assets', detail: game.play_mode === 'native' ? 'In-browser engine · streaming to canvas' : 'Hosted install · server-side cache warm', ms: 1700, icon: <IconBolt width={15} height={15} /> },
      { id: 'webrtc', label: 'Negotiating WebRTC media', detail: 'ICE → DTLS → SRTP · AV1 preferred, H.264 fallback', ms: 1100, icon: <IconWifi width={15} height={15} /> },
    ];
  }, [game.players_online, game.play_mode, region]);

  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());
  const completedRef = useRef(false);
  const baseLatency = region?.latency_ms ?? 18;

  useEffect(() => {
    const stamp = () => new Date().toISOString().slice(11, 19);
    setLogs([`[${stamp()}] dash-cli session init --title "${game.title}" --mode ${game.play_mode}`]);

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (i >= steps.length) {
        setDone(true);
        setLogs((l) => [...l, `[${stamp()}] stream ready · ${game.play_mode === 'native' ? 'canvas' : 'video'} track active`]);
        if (!completedRef.current) {
          completedRef.current = true;
          const elapsed = (Date.now() - startRef.current) / 1000;
          setTimeout(() => onComplete({ region, latency: baseLatency, resolution: game.cloud_tier === 'ultra' ? '2160p60' : '1080p60', bootSeconds: elapsed }), 520);
        }
        return;
      }
      const step = steps[i];
      setActiveStep(i);
      setLogs((l) => [...l, `[${stamp()}] ${step.label.toLowerCase()} — ${step.detail}`]);
      timer = setTimeout(() => {
        i += 1;
        advance();
      }, step.ms);
    };
    advance();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const total = steps.reduce((s, x) => s + x.ms, 0) + 520;
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(100, (elapsed / total) * 100));
      if (elapsed > total) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [steps]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#05060a] p-5">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <motion.div
        className="absolute h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${withAlpha(game.accent, 0.3)}, transparent)` }}
        animate={{ scale: [1, 1.16, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="noise" />

      <div className="relative z-10 w-full max-w-[720px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-9 w-1 rounded-full" style={{ background: game.accent }} />
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-white">Launching {game.title}</h2>
            <p className="text-[12.5px] text-[color:var(--text-faint)]">
              {region?.region ?? 'Edge'} · {region?.gpu_pool ?? 'GPU pool'} · target {bootSeconds}s boot
            </p>
          </div>
        </div>

        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${game.accent}, #ffffff)` }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'linear', duration: 0.12 }}
          />
        </div>

        <ol className="space-y-1.5">
          {steps.map((step, i) => {
            const state = i < activeStep || done ? 'done' : i === activeStep ? 'active' : 'pending';
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300',
                  state === 'active' && 'border-white/[0.14] bg-white/[0.055]',
                  state === 'done' && 'border-white/[0.06] bg-white/[0.02] opacity-60',
                  state === 'pending' && 'border-white/[0.05] bg-white/[0.012] opacity-35',
                )}
              >
                <span
                  className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', state === 'done' ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.12)] text-[#7ee2a8]' : 'border-white/10 bg-white/[0.05]')}
                  style={state === 'active' ? { borderColor: withAlpha(game.accent, 0.45), background: withAlpha(game.accent, 0.14), color: game.accent } : undefined}
                >
                  {state === 'done' ? <IconCheck width={14} height={14} /> : step.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-white">{step.label}</span>
                  <span className="block truncate text-[11.5px] text-[color:var(--text-faint)]">{step.detail}</span>
                </span>
                {state === 'active' && (
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full" style={{ background: game.accent }} />
                )}
              </li>
            );
          })}
        </ol>

        <div
          ref={logRef}
          className="mt-5 h-[104px] overflow-y-auto rounded-xl border border-white/[0.07] bg-black/45 p-3 font-mono text-[11px] leading-relaxed text-[#7ee2a8]/80"
        >
          <AnimatePresence initial={false}>
            {logs.map((line, i) => (
              <motion.div key={`${line}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                {line}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-[color:var(--text-faint)]">
            Estimated ping <span className="font-mono text-white/70">{baseLatency} ms</span> · codec AV1/H.264 · no download required
          </p>
          <button onClick={onCancel} className="btn-ghost !py-2 !text-[12.5px]">
            Cancel launch
          </button>
        </div>
      </div>
    </div>
  );
}
