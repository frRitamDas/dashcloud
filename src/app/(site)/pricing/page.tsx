import type { Metadata } from 'next';
import Link from 'next/link';
import { FinalCta, StatsBand } from '@/components/home/Sections';
import { Reveal } from '@/components/ui/Reveal';
import { IconBolt, IconCheck, IconClose, IconSparkles } from '@/components/ui/Icons';
import { getLiveStats, getSiteSettings } from '@/lib/queries';
import { cn } from '@/lib/utils';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Pricing — free forever, upgrade when you want',
  description:
    'Dash is free to play. Optional Dash Plus and Ultra tiers add queue priority, higher resolution and longer sessions — never a paywall on the games.',
};

type Feature = { label: string; free: boolean | string; plus: boolean | string; ultra: boolean | string };

const features: Feature[] = [
  { label: 'Full instant-play catalogue', free: true, plus: true, ultra: true },
  { label: 'Cloud saves, XP & leaderboards', free: true, plus: true, ultra: true },
  { label: 'Stream resolution', free: '1080p / 60', plus: '1440p / 60', ultra: '4K / 60 HDR' },
  { label: 'Session length', free: '60 min', plus: '4 hours', ultra: 'Unlimited' },
  { label: 'Queue priority', free: 'Standard', plus: 'High', ultra: 'Instant' },
  { label: 'Concurrent cloud instances', free: '1', plus: '2', ultra: '4' },
  { label: 'GPU pool access', free: 'Shared', plus: 'Shared + reserved', ultra: 'Dedicated RTX' },
  { label: 'Preferred regions', free: false, plus: true, ultra: true },
  { label: 'Input latency target', free: '< 45 ms', plus: '< 32 ms', ultra: '< 22 ms' },
  { label: 'Codec', free: 'H.264', plus: 'AV1 / H.265', ultra: 'AV1 + DLSS' },
  { label: 'Priority support', free: false, plus: true, ultra: true },
  { label: 'Cosmetics & Dash Coins bonus', free: false, plus: '500 / month', ultra: '2,000 / month' },
];

export default async function PricingPage() {
  const [{ site, stats }, live] = await Promise.all([getSiteSettings(), getLiveStats()]);

  return (
    <>
      <div className="section py-12 lg:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <span className="kicker">Pricing</span>
          <h1 className="h-display mt-3 text-[36px] leading-[1.05] sm:text-[52px]">Free forever. Optional upgrades.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--text-dim)]">
            Every game on Dash is playable at no cost — no trial timer, no download, no card. Paid tiers only add
            comfort: more resolution, longer sessions and a shorter queue. We will never gate a title behind a paywall.
          </p>
        </header>

        <Reveal className="mt-12">
          <div className="grid gap-4 lg:grid-cols-3">
            <Plan
              name="Free"
              price="₹0"
              cadence="forever"
              blurb="Everything you need to play today."
              cta={{ href: '/signup', label: 'Create free account' }}
              highlights={['All instant-play engines', '1080p60 cloud streams', 'Cloud saves & XP', 'Community support']}
            />
            <Plan
              name="Dash Plus"
              price="₹399"
              cadence="per month"
              blurb="For players who want a longer, sharper session."
              featured
              cta={{ href: '/signup?plan=plus', label: 'Start Dash Plus' }}
              highlights={['1440p60 streams', '4-hour sessions', 'High queue priority', '500 Dash Coins monthly']}
            />
            <Plan
              name="Ultra"
              price="₹999"
              cadence="per month"
              blurb="Dedicated GPUs for the lowest latency we can deliver."
              cta={{ href: '/signup?plan=ultra', label: 'Go Ultra' }}
              highlights={['4K60 HDR', 'Unlimited sessions', 'Dedicated RTX pool', 'Instant queue + priority support']}
            />
          </div>
        </Reveal>

        {/* comparison table */}
        <Reveal className="mt-14">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="w-[38%] px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Compare</th>
                  {['Free', 'Dash Plus', 'Ultra'].map((p) => (
                    <th key={p} className="px-4 pb-3 text-[13px] font-semibold text-white">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.label} className={cn(i % 2 === 1 && 'bg-white/[0.018]')}>
                    <td className="border-t border-white/[0.05] px-4 py-3 text-[13px] text-[color:var(--text-dim)]">{f.label}</td>
                    {(['free', 'plus', 'ultra'] as const).map((k) => (
                      <td key={k} className="border-t border-white/[0.05] px-4 py-3">
                        <Cell value={f[k]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { q: 'Can I really play for free?', a: 'Yes. The whole instant-play catalogue and every cloud title we host is free. Paid tiers only change resolution, session length and queue position.' },
              { q: 'Do I need a powerful PC?', a: 'No. Streams render on our GPUs, so a phone, tablet, Chromebook or five-year-old laptop all work. You need a stable 25 Mbps connection.' },
              { q: 'Can I cancel anytime?', a: 'Cancel in one click from your profile. You keep every save, score and coin you earned.' },
            ].map((item) => (
              <div key={item.q} className="panel rounded-2xl p-5">
                <h3 className="text-[14.5px] font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-dim)]">{item.a}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <StatsBand stats={stats} live={live} />
      <FinalCta site={site} />
    </>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <IconCheck width={16} height={16} className="text-neon-mint" />;
  if (value === false) return <IconClose width={15} height={15} className="text-white/25" />;
  return <span className="text-[13px] font-medium text-white/85">{value}</span>;
}

function Plan({
  name,
  price,
  cadence,
  blurb,
  highlights,
  cta,
  featured = false,
}: {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  highlights: string[];
  cta: { href: string; label: string };
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-transform duration-300 sm:p-7',
        featured
          ? 'border-brand-500/45 bg-[linear-gradient(180deg,rgba(109,92,255,0.14),rgba(109,92,255,0.03))] shadow-glow'
          : 'border-white/[0.08] bg-white/[0.022] hover:border-white/[0.16]',
      )}
    >
      {featured && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand-500/18 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-100">
          <IconSparkles width={11} height={11} /> Most popular
        </span>
      )}
      <h3 className="text-[15px] font-semibold tracking-tight text-white">{name}</h3>
      <p className="mt-1.5 min-h-[38px] text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{blurb}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-mono text-[38px] font-bold leading-none tracking-tight text-white">{price}</span>
        <span className="text-[12px] text-[color:var(--text-faint)]">{cadence}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
            <IconCheck width={14} height={14} className={cn('mt-[3px] shrink-0', featured ? 'text-brand-200' : 'text-neon-mint')} />
            {h}
          </li>
        ))}
      </ul>
      <Link href={cta.href} className={cn('mt-7 w-full justify-center !py-3', featured ? 'btn-primary' : 'btn-ghost')}>
        {cta.label}
        <IconBolt width={15} height={15} />
      </Link>
    </div>
  );
}
