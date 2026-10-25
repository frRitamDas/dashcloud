'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep diagnostic details in server logs; show only a safe reference to operators.
    console.error('[dash-admin] route error', error.digest ?? error.name);
  }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0b0b0b] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Control plane · Error</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">This view could not load</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          The request failed unexpectedly. Your changes may not have been saved. Retry the view before submitting the action again.
        </p>
        {error.digest && <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-neutral-500">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="btn-primary">Retry view</button>
          <Link href="/admin" className="btn-ghost">Back to overview</Link>
        </div>
      </section>
    </main>
  );
}
