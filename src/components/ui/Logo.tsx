'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Brand mark.
 *
 * Drop your own artwork at `public/logo.png` (any size — it is rendered inside a
 * rounded square) and it is picked up automatically, no code change needed.
 * If the file is missing, a generated SVG mark is used instead so the UI never
 * shows a broken image.
 */
export function LogoMark({
  size = 38,
  className,
  rounded = 11,
}: {
  size?: number;
  className?: string;
  rounded?: number;
}) {
  const [missing, setMissing] = useState(false);

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden gpu-layer', className)}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.16) inset, 0 10px 24px -14px rgba(109,92,255,0.9)',
        background: missing ? 'linear-gradient(150deg,#7c83ff 0%,#4a2ed0 52%,#12131f 100%)' : undefined,
      }}
    >
      {!missing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="Dash logo"
          width={size}
          height={size}
          onError={() => setMissing(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
          <defs>
            <linearGradient id="lg-d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#c9c4ff" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d="M14 9h11.5c9.4 0 15.5 6.2 15.5 15S34.9 39 25.5 39H14V9Zm7.4 6.6v16.8h4.3c5.4 0 8.6-3.4 8.6-8.4s-3.2-8.4-8.6-8.4h-4.3Z"
            fill="url(#lg-d)"
          />
          <circle cx="35.5" cy="14.5" r="3.2" fill="#22d3ee" />
        </svg>
      )}
    </span>
  );
}

export function Logo({
  size = 38,
  withWordmark = true,
  className,
  tagline,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  tagline?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-[-0.02em] text-white">Dash</span>
          <span className="mt-[3px] text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
            {tagline ?? 'Cloud Gaming'}
          </span>
        </span>
      )}
    </span>
  );
}
