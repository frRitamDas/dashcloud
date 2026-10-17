'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-1', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-lg font-semibold transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2 text-[13px]',
              active ? 'text-white' : 'text-[color:var(--text-faint)] hover:text-white/80',
            )}
            aria-current={active}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${items.map((i) => i.id).join('-')}`}
                className="absolute inset-0 rounded-lg border border-white/[0.09] bg-white/[0.075] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {item.icon}
              {item.label}
              {item.badge !== undefined && (
                <span className="rounded-full bg-white/10 px-1.5 py-[1px] text-[10px] font-bold tabular-nums">{item.badge}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
