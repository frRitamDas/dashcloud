'use client';

import { motion } from 'framer-motion';

export function EngineStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-md">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="font-mono text-[14px] font-bold tabular-nums" style={{ color: accent ?? '#fff' }}>
        {value}
      </div>
    </div>
  );
}

export function EngineOverlay({
  title,
  subtitle,
  onStart,
  cta = 'Start',
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  onStart: () => void;
  cta?: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-5 backdrop-blur-[3px]">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0d16]/94 p-6 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: accent }} />
        <h3 className="text-[19px] font-semibold tracking-tight text-white">{title}</h3>
        {subtitle && <p className="mt-2 text-[13px] leading-relaxed text-white/55">{subtitle}</p>}
        {children}
        <button
          onClick={onStart}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-[14px] font-bold transition-transform duration-150 active:scale-[0.98]"
          style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)`, color: '#06070b', boxShadow: `0 14px 34px -16px ${accent}` }}
        >
          {cta}
        </button>
      </motion.div>
    </div>
  );
}

export function MobileControls({
  buttons,
}: {
  buttons: { label: string; onPress: () => void; onRelease?: () => void; wide?: boolean }[];
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-3 sm:hidden">
      {buttons.map((b) => (
        <button
          key={b.label}
          onTouchStart={(e) => {
            e.preventDefault();
            b.onPress();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            b.onRelease?.();
          }}
          onMouseDown={b.onPress}
          onMouseUp={b.onRelease}
          className={`pointer-events-auto select-none rounded-xl border border-white/12 bg-black/55 px-4 py-3 text-[12px] font-bold text-white/85 backdrop-blur-md active:bg-white/15 ${b.wide ? 'flex-1' : ''}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
