import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LiveStats, ServiceStatus, SiteSettings, StatsSettings } from '@/lib/supabase/types';
import { Counter } from '@/components/ui/Counter';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { StatusDot } from '@/components/ui/Badge';
import {
  IconActivity,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconCloud,
  IconCoins,
  IconCpu,
  IconGauge,
  IconGamepad,
  IconGlobe,
  IconLayers,
  IconLock,
  IconMonitor,
  IconPlay,
  IconServer,
  IconShield,
  IconSparkles,
  IconStar,
  IconTrophy,
  IconUsers,
  IconWifi,
} from '@/components/ui/Icons';

export function SectionHeading({ kicker, title, copy, action }: { kicker: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div>
        <span className="kicker">{kicker}</span>
        <h2 className="h-display mt-2 text-[28px] sm:text-[36px]">{title}</h2>
        {copy && <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-[color:var(--text-dim)]">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function StatsBand({ stats, live }: { stats: StatsSettings; live: LiveStats }) {
  const items = [
    { label: 'Players registered', value: stats.totalPlayers, suffix: '+', format: true },
    { label: 'Titles hosted', value: stats.gamesHosted, suffix: '' },
    { label: 'Countries served', value: stats.countries, suffix: '' },
    { label: 'Average boot time', value: stats.avgBootSeconds, suffix: 's' },
    { label: 'Playing right now', value: live.playersOnline, suffix: '' },
    { label: 'Network uptime', value: stats.uptimePercent, suffix: '%', decimals: 2 },
  ];
  return (
    <section className="section py-14">
      <Reveal>
        <div className="panel grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl px-6 py-9 sm:grid-cols-3 lg:grid-cols-6 lg:px-9">
          {items.map((item) => (
            <div key={item.label}>
              <p className="font-mono text-[26px] font-bold tabular-nums text-white lg:text-[30px]">
                <Counter to={item.value} decimals={item.decimals ?? 0} suffix={item.suffix} />
              </p>
              <p className="mt-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-faint)]">{item.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
const steps = [
  {
    n: '01',
    icon: <IconGamepad width={18} height={18} />,
    title: 'Pick a title',
    copy: 'Browse a catalogue of AAA and indie games. Instant-play engines start in the browser; cloud titles boot on a GPU node.',
  },
  {
    n: '02',
    icon: <IconServer width={18} height={18} />,
    title: 'Dash provisions a node',
    copy: 'We reserve the healthiest GPU in your region, boot an isolated container and warm the game cache — typically under ten seconds.',
  },
  {
    n: '03',
    icon: <IconWifi width={18} height={18} />,
    title: 'Stream over WebRTC',
    copy: 'Video is encoded with AV1 (H.264 fallback) and delivered over an encrypted WebRTC media path with adaptive bitrate.',
  },
  {
    n: '04',
    icon: <IconGauge width={18} height={18} />,
    title: 'Play on any screen',
    copy: 'Keyboard, mouse, touch or gamepad. Your input goes upstream at 1000 Hz polling; the frame comes back in milliseconds.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section scroll-mt-24 py-16 lg:py-24">
      <SectionHeading
        kicker="How it works"
        title="From click to playable in four steps"
        copy="Nothing installs on your device. The heavy lifting happens in a data centre; your browser just receives frames and sends input."
      />
      <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <RevealItem key={step.n}>
            <div className="card-hover group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022] p-6">
              <span className="absolute right-5 top-4 font-mono text-[42px] font-bold leading-none text-white/[0.05] transition-colors duration-300 group-hover:text-white/[0.09]">
                {step.n}
              </span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.05] text-brand-200 transition-colors duration-300 group-hover:border-brand-500/45 group-hover:bg-[rgba(109,92,255,0.14)]">
                {step.icon}
              </span>
              <h3 className="relative mt-4 text-[16px] font-semibold tracking-tight text-white">{step.title}</h3>
              <p className="relative mt-2 text-[13px] leading-relaxed text-[color:var(--text-dim)]">{step.copy}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ------------------------------------------------------------------ */
const tech = [
  { icon: <IconCpu width={17} height={17} />, title: 'RTX 4090 & A6000 pools', copy: 'Dedicated GPU nodes per session — never shared mid-frame. Ultra tier unlocks 4K60 with ray tracing.' },
  { icon: <IconCloud width={17} height={17} />, title: 'WebRTC + AV1', copy: 'Sub-40 ms glass-to-glass on a healthy link, with adaptive bitrate that survives Wi-Fi drops.' },
  { icon: <IconLock width={17} height={17} />, title: 'Isolated containers', copy: 'Every session runs in a fresh sandbox that is destroyed on exit. Saves sync to your account, not the node.' },
  { icon: <IconShield width={17} height={17} />, title: 'Hardened by default', copy: 'Row-level security on every table, strict CSP, signed admin sessions, rate limiting and lockout on brute force.' },
  { icon: <IconLayers width={17} height={17} />, title: 'Browser-native engines', copy: 'Seven titles ship as WebGL engines that run locally, so there is zero queue and zero latency at all.' },
  { icon: <IconActivity width={17} height={17} />, title: 'Live telemetry', copy: 'Region health, load and latency update in real time across the site through Supabase realtime channels.' },
];

export function Technology() {
  return (
    <section id="technology" className="relative scroll-mt-24 py-16 lg:py-24">
      <div className="section">
        <SectionHeading
          kicker="Technology"
          title="Built like a real streaming platform"
          copy="Dash is a full-stack product: Postgres + realtime, edge-rendered Next.js, GPU session orchestration and an admin plane that controls it live."
          action={
            <Link href="/status" className="btn-ghost">
              <IconServer width={15} height={15} /> Live network status
            </Link>
          }
        />
        <RevealGroup className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {tech.map((t) => (
            <RevealItem key={t.title}>
              <div className="card-hover flex h-full gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-neon-cyan">
                  {t.icon}
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold tracking-tight text-white">{t.title}</span>
                  <span className="mt-1.5 block text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{t.copy}</span>
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function RegionsStrip({ statuses }: { statuses: ServiceStatus[] }) {
  const regions = statuses.filter((s) => s.region !== 'Global');
  const services = statuses.filter((s) => s.region === 'Global');
  return (
    <section id="regions" className="section scroll-mt-24 py-16 lg:py-20">
      <SectionHeading
        kicker="Network"
        title="Six GPU regions, one queue"
        copy="Dash routes you to the healthiest node automatically. Status below is the same data the admin panel controls — it updates live for every visitor."
        action={
          <Link href="/status" className="btn-ghost">
            Full status page <IconArrowRight width={15} height={15} />
          </Link>
        }
      />
      <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((r) => (
          <RevealItem key={r.id}>
            <div className="card-hover rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    <StatusDot status={r.status} />
                    {r.region}
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">{r.region_code}</p>
                </div>
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 font-mono text-[11px] font-semibold tabular-nums text-white/75">
                  {r.latency_ms} ms
                </span>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{r.message}</p>
              <div className="mt-4 space-y-2">
                <Meter label="Node load" value={r.load_percent} tone={r.load_percent > 80 ? 'warn' : 'good'} />
                <div className="flex items-center justify-between text-[11.5px] text-[color:var(--text-faint)]">
                  <span className="flex items-center gap-1.5">
                    <IconCpu width={12} height={12} /> {r.gpu_pool}
                  </span>
                  <span className="capitalize">{r.status}</span>
                </div>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.018] px-5 py-4">
          {services.map((s) => (
            <span key={s.id} className="flex items-center gap-2 text-[12.5px] text-[color:var(--text-dim)]">
              <StatusDot status={s.status} />
              {s.service}
              <span className="font-mono text-[11px] text-[color:var(--text-faint)]">{s.latency_ms}ms</span>
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: 'good' | 'warn' }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-[color:var(--text-faint)]">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-white/65">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, value)}%`, background: tone === 'warn' ? 'linear-gradient(90deg,#fbbf24,#fb7185)' : 'linear-gradient(90deg,#6d5cff,#22d3ee)' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    highlight: false,
    tagline: 'Everything you need to start playing today.',
    features: ['Unlimited instant-play engines', 'Standard cloud nodes (1080p60)', '6 GPU regions', 'Leaderboards & cloud saves', 'Community support'],
    cta: 'Start playing',
    href: '/signup',
  },
  {
    name: 'Dash Plus',
    price: '₹249',
    period: 'per month',
    highlight: true,
    tagline: 'Priority queues and premium nodes for regulars.',
    features: ['Everything in Free', 'Priority queue — skip the line', 'Premium nodes (1440p120)', '4 concurrent saves per title', 'Dash Coins ×2 on every session', 'Email support'],
    cta: 'Earn coins to unlock',
    href: '/pricing',
  },
  {
    name: 'Ultra',
    price: '₹699',
    period: 'per month',
    highlight: false,
    tagline: 'The full RTX experience, streamed at 4K.',
    features: ['Everything in Plus', 'RTX ultra nodes (4K60 + ray tracing)', 'Zero-queue guarantee', 'AV1 high-bitrate streaming', 'Early access to new engines', 'Priority 24/7 support'],
    cta: 'See details',
    href: '/pricing',
  },
];

export function PricingTeaser() {
  return (
    <section className="section py-16 lg:py-24">
      <SectionHeading
        kicker="Plans"
        title="Free forever. Upgrade only if you want more GPU."
        copy="No credit card, no trial clock. Dash Plus and Ultra can also be unlocked with Dash Coins earned simply by playing."
      />
      <RevealGroup className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <RevealItem key={plan.name}>
            <div
              className={`card-hover relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 ${
                plan.highlight ? 'border-[rgba(109,92,255,0.4)] bg-[rgba(109,92,255,0.07)]' : 'border-white/[0.07] bg-white/[0.022]'
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-500/25 blur-3xl" />
                  <span className="absolute right-5 top-5 rounded-full border border-brand-400/40 bg-brand-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-100">
                    Most popular
                  </span>
                </>
              )}
              <h3 className="relative text-[15px] font-semibold uppercase tracking-[0.14em] text-white/70">{plan.name}</h3>
              <p className="relative mt-3 flex items-baseline gap-1.5">
                <span className="font-mono text-[38px] font-bold leading-none tracking-tight text-white">{plan.price}</span>
                <span className="text-[12.5px] text-[color:var(--text-faint)]">{plan.period}</span>
              </p>
              <p className="relative mt-3 text-[13px] leading-relaxed text-[color:var(--text-dim)]">{plan.tagline}</p>
              <ul className="relative mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-[color:var(--text-dim)]">
                    <IconCheck width={15} height={15} className="mt-[2px] shrink-0 text-neon-mint" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={`relative mt-6 ${plan.highlight ? 'btn-primary' : 'btn-ghost'} justify-center`}>
                {plan.cta}
              </Link>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ------------------------------------------------------------------ */
const voices = [
  { name: 'Aarav Mehta', city: 'Mumbai', text: 'My laptop is eight years old and I streamed an open-world title at 60fps from a browser tab. The Mumbai node ping sits around 11ms — it feels local.', stars: 5 },
  { name: 'Sneha Iyer', city: 'Bengaluru', text: 'No 90 GB download, no patch waiting. I clicked play and was in the world in about nine seconds. The admin status page is honest about node load too.', stars: 5 },
  { name: 'Rohan Kapoor', city: 'Delhi', text: 'The instant-play engines are genuinely fun — the voxel sandbox and city driver kept me up way too late. Leaderboards reset weekly so it stays competitive.', stars: 5 },
  { name: 'Emily Carter', city: 'London', text: 'Tried it on hotel Wi-Fi while travelling. Bitrate adapted smoothly and I never got a stutter. Free tier with no card required is unheard of.', stars: 4 },
];

export function Voices() {
  return (
    <section className="section py-16 lg:py-20">
      <SectionHeading kicker="Players" title="What people say after their first session" />
      <RevealGroup className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {voices.map((v) => (
          <RevealItem key={v.name}>
            <figure className="card-hover flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} width={12} height={12} className={i < v.stars ? 'text-[#fbbf24]' : 'text-white/15'} />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-[13px] leading-relaxed text-[color:var(--text-dim)]">“{v.text}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-white/[0.06] pt-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-[11px] font-bold text-white">
                  {v.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <span>
                  <span className="block text-[12.5px] font-semibold text-white">{v.name}</span>
                  <span className="block text-[11px] text-[color:var(--text-faint)]">{v.city}</span>
                </span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function FinalCta({ site }: { site: SiteSettings }) {
  return (
    <section className="section py-16 lg:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(135deg,#0e1124_0%,#0a0c15_55%,#0b0f1c_100%)] px-6 py-14 text-center sm:px-14 lg:py-20">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-500/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-neon-cyan/14 blur-3xl" />
          <div className="noise" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11.5px] font-medium text-white/70">
              <IconSparkles width={13} height={13} className="text-neon-violet" />
              No card · No download · No waiting
            </span>
            <h2 className="h-display mx-auto mt-6 max-w-3xl text-[32px] leading-[1.08] sm:text-[46px]">
              Your next session starts in about nine seconds
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-[color:var(--text-dim)]">
              Join {site.name} free and play instantly in the browser. Earn Dash Coins, climb the leaderboards and keep your
              saves synced across every device you own.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary !px-6 !py-3.5 !text-[15px] !rounded-2xl">
                <IconPlay width={16} height={16} /> Create free account
              </Link>
              <Link href="/games?mode=native" className="btn-outline !px-5 !py-3.5 !text-[14.5px] !rounded-2xl">
                Play as guest
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12px] text-[color:var(--text-faint)]">
              <span className="flex items-center gap-1.5">
                <IconUsers width={13} height={13} /> Cloud saves on every account
              </span>
              <span className="flex items-center gap-1.5">
                <IconTrophy width={13} height={13} /> Weekly global leaderboards
              </span>
              <span className="flex items-center gap-1.5">
                <IconCoins width={13} height={13} /> Earn coins by playing
              </span>
              <span className="flex items-center gap-1.5">
                <IconMonitor width={13} height={13} /> Keyboard, touch & gamepad
              </span>
              <span className="flex items-center gap-1.5">
                <IconGlobe width={13} height={13} /> 6 GPU regions worldwide
              </span>
              <span className="flex items-center gap-1.5">
                <IconBolt width={13} height={13} /> Adaptive bitrate streaming
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
