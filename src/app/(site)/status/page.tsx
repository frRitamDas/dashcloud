import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusLive } from '@/components/status/StatusLive';
import { getLiveStats, getServiceStatus, getSiteSettings } from '@/lib/queries';
import { Reveal } from '@/components/ui/Reveal';
import { IconLock, IconMail } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Network status',
  description: 'Live status of every Dash cloud gaming region and platform service — GPU load, latency and incident history.',
};

export default async function StatusPage() {
  const [statuses, live, settings] = await Promise.all([getServiceStatus(), getLiveStats(), getSiteSettings()]);

  // Historical uptime is intentionally empty until incident events are persisted.
  const history: { label: string; ok: boolean }[] = [];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Platform health"
        title="Service status."
        description="Live health for the regions and services that power Dash. Status changes are managed through the authenticated operations console."
      />

      <StatusLive initialStatuses={statuses} initialLive={live} history={history} />

      <Reveal className="mt-10">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-brand-200">
              <IconMail width={16} height={16} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-white">Report a problem</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                Seeing stutter, input lag or a failed launch? Open a ticket and the on-call team gets it immediately.
              </p>
              <Link href="/support" className="btn-ghost mt-3 !py-2 !text-[12.5px]">
                Contact support
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-neon-mint">
              <IconLock width={16} height={16} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-white">Operator access</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                Region status, maintenance windows and announcements are controlled from the signed admin console.
              </p>
              <Link href="/admin" className="btn-ghost mt-3 !py-2 !text-[12.5px]">
                Admin panel
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      <p className="mt-8 text-center text-[12px] text-[color:var(--text-faint)]">
        {settings.site.fullName} · {settings.site.credits}
      </p>
    </div>
  );
}
