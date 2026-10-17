'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconCheck, IconClose, IconInfo, IconWarning } from './Icons';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastCtx = createContext<{ push: (message: string, kind?: ToastKind) => void }>({ push: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[120] flex w-[min(94vw,420px)] -translate-x-1/2 flex-col gap-2 sm:bottom-7 sm:left-auto sm:right-7 sm:translate-x-0">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[13px] font-medium shadow-lift backdrop-blur-xl',
                t.kind === 'success' && 'border-[rgba(74,222,128,0.28)] bg-[#0b1512]/92 text-[#b7f0cd]',
                t.kind === 'error' && 'border-[rgba(251,113,133,0.3)] bg-[#170c10]/92 text-[#ffc9d1]',
                t.kind === 'info' && 'border-white/12 bg-[#0b0e17]/92 text-white/85',
              )}
            >
              <span className="shrink-0">
                {t.kind === 'success' ? (
                  <IconCheck width={16} height={16} />
                ) : t.kind === 'error' ? (
                  <IconWarning width={16} height={16} />
                ) : (
                  <IconInfo width={16} height={16} />
                )}
              </span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                className="shrink-0 rounded-md p-1 opacity-55 transition-opacity hover:opacity-100"
                aria-label="Dismiss"
              >
                <IconClose width={13} height={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
