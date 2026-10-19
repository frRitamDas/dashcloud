import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { PageHeader } from '@/components/ui/PageHeader';

export type LegalSection = { heading: string; body: ReactNode };

export function LegalLayout({
  title,
  updated,
  intro,
  sections,
  tocId,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  tocId: string;
}) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Legal"
        title={title}
        description={intro}
        className="!mb-0"
      />
      <p className="mt-4 text-[12px] text-neutral-500">Last updated {updated}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">On this page</p>
            {sections.map((s, i) => (
              <a
                key={s.heading}
                href={`#${tocId}-${i}`}
                className="block rounded-lg px-3 py-2 text-[12.5px] leading-snug text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                <span className="mr-2 font-mono text-[11px] text-white/25">{String(i + 1).padStart(2, '0')}</span>
                {s.heading}
              </a>
            ))}
            <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.022] p-4">
              <p className="text-[12px] leading-relaxed text-[color:var(--text-dim)]">Questions about this document?</p>
              <Link href="/support" className="mt-2 inline-block text-[12.5px] font-semibold text-brand-300 hover:text-brand-200">
                Contact support →
              </Link>
            </div>
          </div>
        </nav>

        <Reveal className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`${tocId}-${i}`} className="scroll-mt-24">
              <h2 className="flex items-baseline gap-3 text-[19px] font-semibold tracking-tight text-white">
                <span className="font-mono text-[12px] text-brand-400">{String(i + 1).padStart(2, '0')}</span>
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[13.5px] leading-[1.8] text-[color:var(--text-dim)]">{s.body}</div>
            </section>
          ))}
        </Reveal>
      </div>
    </div>
  );
}
