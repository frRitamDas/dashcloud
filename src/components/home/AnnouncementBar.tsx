'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Announcement } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { IconBell, IconClose } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const toneClass: Record<Announcement['kind'], string> = {
  info: 'border-white/[0.08] bg-white/[0.03] text-white/75',
  success: 'border-[rgba(74,222,128,0.22)] bg-[rgba(74,222,128,0.08)] text-[#b7f0cd]',
  warning: 'border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.08)] text-[#fde68a]',
  danger: 'border-[rgba(251,113,133,0.24)] bg-[rgba(251,113,133,0.09)] text-[#ffc9d1]',
};

export function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
  const [items, setItems] = useState<Announcement[]>(announcements);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Live updates: anything an admin publishes shows up without a refresh.
  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel('announcements-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, async () => {
        const { data } = await sb.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5);
        if (data) setItems(data as Announcement[]);
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(id);
  }, [items.length]);

  if (dismissed || !items.length) return null;
  const current = items[index];
  if (!current) return null;

  const inner = (
    <>
      <IconBell width={14} height={14} className="shrink-0 opacity-70" />
      <span className="truncate text-[12.5px] font-semibold">{current.title}</span>
      {current.body && <span className="hidden truncate text-[12.5px] opacity-70 sm:inline">— {current.body}</span>}
      {current.link && (
        <span className="ml-1 hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold underline decoration-current/40 underline-offset-2 sm:flex">
          Details <IconArrow width={12} height={12} />
        </span>
      )}
    </>
  );

  return (
    <div className="section pt-4">
      <div className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5 backdrop-blur-md', toneClass[current.kind])}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            {current.link ? (
              <Link href={current.link} className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-90">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                aria-label={`Announcement ${i + 1}`}
                className={cn('h-1 rounded-full transition-all duration-300', i === index ? 'w-4 bg-current opacity-80' : 'w-1.5 bg-current opacity-25 hover:opacity-50')}
              />
            ))}
          </div>
        )}

        <button onClick={() => setDismissed(true)} aria-label="Dismiss announcement" className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100">
          <IconClose width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

function IconArrow({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}
