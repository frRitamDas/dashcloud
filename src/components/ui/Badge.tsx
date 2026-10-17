import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'mint' | 'amber' | 'rose' | 'cyan';

const tones: Record<Tone, string> = {
  neutral: 'bg-white/[0.05] text-[color:var(--text-dim)] border-white/10',
  brand: 'bg-[rgba(109,92,255,0.14)] text-brand-200 border-[rgba(109,92,255,0.35)]',
  mint: 'bg-[rgba(74,222,128,0.12)] text-[#7ee2a8] border-[rgba(74,222,128,0.3)]',
  amber: 'bg-[rgba(251,191,36,0.12)] text-[#fcd34d] border-[rgba(251,191,36,0.3)]',
  rose: 'bg-[rgba(251,113,133,0.12)] text-[#fda4af] border-[rgba(251,113,133,0.3)]',
  cyan: 'bg-[rgba(34,211,238,0.12)] text-[#67e8f9] border-[rgba(34,211,238,0.3)]',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.1em]',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />}
      {children}
    </span>
  );
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const color =
    status === 'operational' || status === 'live'
      ? '#4ade80'
      : status === 'degraded' || status === 'queue'
        ? '#fbbf24'
        : status === 'partial' || status === 'maintenance'
          ? '#38bdf8'
          : '#fb7185';
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: color }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}
