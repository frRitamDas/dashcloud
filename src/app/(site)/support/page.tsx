import type { Metadata } from 'next';
import Link from 'next/link';
import { SupportForm } from '@/components/support/SupportForm';
import { Reveal } from '@/components/ui/Reveal';
import { IconActivity, IconMail, IconTicket, IconWifi } from '@/components/ui/Icons';
import { getServiceStatus, getSiteSettings } from '@/lib/queries';
import { StatusDot } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Dash Cloud Gaming — launch failures, latency, account issues and refund questions.',
};

const faqs = [
  {
    q: 'A game will not launch',
    a: 'Most launch failures come from the browser blocking autoplay or from a stale GPU allocation. Reload the play page, pick a different region in the launcher, and make sure hardware acceleration is enabled in your browser settings.',
  },
  {
    q: 'Input feels delayed',
    a: 'Choose the region closest to you on the status page — Mumbai for India, Singapore for SEA, Frankfurt for EU. A wired connection or 5 GHz Wi-Fi cuts another 8–15 ms. If a region shows degraded load, switch to a neighbour.',
  },
  {
    q: 'My score did not reach the leaderboard',
    a: 'Scores are validated server-side and rate limited. Runs shorter than 30 seconds or impossibly high values are rejected. Play again and your next submission will land within a second through Supabase realtime.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Use the sign-in page and choose a new password — or email support and we will send a recovery link. Sessions expire after two hours of inactivity for your protection.',
  },
  {
    q: 'Is Dash really free?',
    a: 'Yes. Every title is playable without payment. Paid tiers only add resolution, session length and queue priority.',
  },
  {
    q: 'Which devices work?',
    a: 'Any modern browser with WebGL2: Windows, macOS, Linux, ChromeOS, Android and iOS. For cloud titles a gamepad over Bluetooth or USB is supported natively.',
  },
];

export default async function SupportPage() {
  const [{ site }, statuses] = await Promise.all([getSiteSettings(), getServiceStatus()]);
  const affected = statuses.filter((s) => s.status !== 'operational');

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Support"
        title="Get back to playing."
        description="Tell us what happened and include the game slug or region when possible. Your ticket is stored securely for the support team."
        action={<div className="flex flex-wrap gap-2.5"><a href={`mailto:${site.supportEmail}`} className="btn-ghost !py-2.5 !text-[13px]"><IconMail width={15} height={15} />{site.supportEmail}</a><Link href="/status" className="btn-ghost !py-2.5 !text-[13px]"><IconActivity width={15} height={15} />Service status</Link></div>}
      />

      {affected.length > 0 && (
        <Reveal className="mb-8">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(251,191,36,0.24)] bg-[rgba(251,191,36,0.06)] px-5 py-4">
            <IconWifi width={17} height={17} className="text-[#fcd34d]" />
            <p className="flex-1 text-[13px] leading-relaxed text-[#fde68a]">
              Known issues right now:{' '}
              {affected.map((s) => (
                <span key={s.id} className="mr-2 inline-flex items-center gap-1.5">
                  <StatusDot status={s.status} />
                  {s.service || s.region} — {s.message}
                </span>
              ))}
            </p>
            <Link href="/status" className="text-[12.5px] font-semibold text-[#fcd34d] underline decoration-[#fcd34d]/40 underline-offset-2">
              Details
            </Link>
          </div>
        </Reveal>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <IconTicket width={16} height={16} className="text-brand-300" />
            <h2 className="text-[17px] font-semibold tracking-tight text-white">Open a ticket</h2>
          </div>
          <SupportForm />

          <div className="mt-10">
            <h2 className="mb-4 text-[17px] font-semibold tracking-tight text-white">Common questions</h2>
            <div className="space-y-2.5">
              {faqs.map((f) => (
                <details key={f.q} className="panel group rounded-2xl px-5 py-4 open:border-white/[0.16]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-white">
                    {f.q}
                    <span className="shrink-0 text-[color:var(--text-faint)] transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-[color:var(--text-dim)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-white">Response times</h3>
            <dl className="mt-3.5 space-y-2.5 text-[12.5px]">
              {[
                ['Critical — service down', '< 30 minutes'],
                ['Account & billing', '< 4 hours'],
                ['Gameplay questions', '< 24 hours'],
                ['Feature requests', 'Weekly review'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2.5 last:border-0 last:pb-0">
                  <dt className="text-[color:var(--text-dim)]">{k}</dt>
                  <dd className="font-mono text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-white">Before you write</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              <li>· Check the live network status page.</li>
              <li>· Note your browser, device and region.</li>
              <li>· Mention the game slug, e.g. <code className="font-mono text-white/70">dashcraft</code>.</li>
              <li>· Never send passwords or session tokens.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
            <h3 className="text-[14px] font-semibold text-white">{site.fullName}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
              {site.description}
            </p>
            <p className="mt-3 text-[11.5px] text-[color:var(--text-faint)]">{site.credits}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
