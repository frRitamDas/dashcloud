'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';
import { IconArrowRight, IconRefresh, IconWarning } from '@/components/ui/Icons';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface a client-side breadcrumb without leaking details to the UI.
    console.error('[dash] unhandled render error', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="section flex min-h-[76vh] flex-col items-center justify-center py-16 text-center">
      <LogoMark size={46} />
      <span className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.1)]">
        <IconWarning width={20} height={20} className="text-[#fda4af]" />
      </span>
      <h1 className="h-display mt-5 text-[30px] leading-tight sm:text-[42px]">Something went wrong on our side</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[color:var(--text-dim)]">
        The page hit an unexpected error. Your progress and cloud saves are safe — retrying usually fixes it.
      </p>
      {error.digest && <p className="mt-3 font-mono text-[11px] text-[color:var(--text-faint)]">reference {error.digest}</p>}

      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <button onClick={reset} className="btn-primary">
          <IconRefresh width={16} height={16} /> Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to home <IconArrowRight width={15} height={15} />
        </Link>
      </div>
    </div>
  );
}
