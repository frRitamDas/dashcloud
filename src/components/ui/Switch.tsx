'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[24px] w-[42px] shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-40',
        checked ? 'border-[rgba(109,92,255,0.6)] bg-[rgba(109,92,255,0.42)]' : 'border-white/12 bg-white/[0.06]',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 620, damping: 34 }}
        className={cn(
          'absolute h-[17px] w-[17px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.6)]',
          checked ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
