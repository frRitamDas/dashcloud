import type { Metadata } from 'next';
import Link from 'next/link';
import { FinalCta, StatsBand } from '@/components/home/Sections';
import { Reveal } from '@/components/ui/Reveal';
import { GameArt } from '@/components/art/GameArt';
import { IconBolt, IconCloud, IconCpu, IconGlobe, IconIndia, IconLayers, IconShield } from '@/components/ui/Icons';
import { getGames, getLiveStats, getServiceStatus, getSiteSettings } from '@/lib/queries';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About Dash',
  description: 'Dash is a free cloud gaming platform built in India. Learn how the streaming stack works and who makes it.',
};

const timeline = [
  { year: '2025', title: 'The idea', copy: 'A friend in Guwahati could not run a modern game on a four-year-old laptop. That single conversation became the reason Dash exists.' },
  { year: '2026 Q1', title: 'First engines', copy: 'Original browser-native engines — voxel sandbox, city driving, arcade classics — shipped with zero install and instant boot.' },
  { year: '2026 Q2', title: 'Cloud regions', copy: 'GPU pools came online in Mumbai, Singapore, Frankfurt, Virginia, São Paulo and Tokyo with automatic region selection.' },
  { year: '2026 Q3', title: 'Live control plane', copy: 'Operators gained real-time control of region health, maintenance windows and announcements pushed straight to players.' },
];

const stack = [
  { icon: <IconCloud width={16} height={16} />, title: 'Edge-rendered app', copy: 'Next.js App Router on Vercel — server components stream the shell, interactive islands hydrate on demand.' },
  { icon: <IconLayers width={16} height={16} />, title: 'Postgres as the source of truth', copy: 'Supabase holds games, profiles, scores, sessions and status. Row-level security governs every read and write.' },
  { icon: <IconBolt width={16} height={16} />, title: 'Realtime by default', copy: 'Status changes, announcements and leaderboard entries arrive over Postgres change feeds — no polling loops.' },
  { icon: <IconCpu width={16} height={16} />, title: 'GPU streaming', copy: 'Cloud titles run on remote GPUs and stream AV1/H.264 over WebRTC with hardware-decoded frames in the browser.' },
  { icon: <IconShield width={16} height={16} />, title: 'Security first', copy: 'Strict CSP, hashed-only admin credentials, signed httpOnly sessions, rate limiting and validated inputs everywhere.' },
  { icon: <IconGlobe width={16} height={16} />, title: 'Built for slow networks too', copy: 'Adaptive bitrate, regional routing and a lean client bundle keep play smooth even on 25 Mbps lines.' },
];

export default async function AboutPage() {
  const [{ site, stats }, live, statuses, games] = await Promise.all([getSiteSettings(), getLiveStats(), getServiceStatus(), getGames({ limit: 8 })]);

  return (
    <>
      <div className="section py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          <div>
            <span className="kicker">About</span>
            <h1 className="h-display mt-3 text-[34px] leading-[1.08] sm:text-[50px]">
              Games should not depend on the machine you were born with.
            </h1>
            <div className="mt-6 space-y-4 text-[14.5px] leading-[1.75] text-[color:var(--text-dim)]">
              <p>
                Dash is a free cloud gaming platform. You open a browser, pick a game and play — no download, no install,
                no 40 GB patch and no graphics card requirement. The heavy lifting happens on GPUs in a region near you;
                only video and input travel over the wire.
              </p>
              <p>
                We keep the free tier genuinely free because that was the point from the beginning. Paid plans exist to
                fund the GPU pool and buy you comfort — more resolution, longer sessions, a shorter queue — never access
                to a title you could not already play.
              </p>
              <p>
                The catalogue mixes two kinds of games. Original Dash Studios engines run natively in your browser and are
                playable today. Major published titles are streamed from cloud infrastructure operated under licence by
                their rights holders; where a licensed stream is not yet available we show that honestly instead of
                pretending otherwise.
              </p>
            </div>

            <div className="mt-9 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,153,51,0.3)] bg-[rgba(255,153,51,0.1)]">
                  <IconIndia width={19} height={19} className="text-[#ffb27a]" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold tracking-tight text-white">Made by Ritam Das from India</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
                    Designed, built and operated from Kolkata. Dash exists to prove that a premium gaming experience can
                    be delivered over an ordinary Indian broadband connection.
                  </p>
                  <Link href={`mailto:${site.supportEmail}`} className="mt-3 inline-block text-[12.5px] font-semibold text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
                    {site.supportEmail}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="panel rounded-2xl p-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Right now</h3>
              <dl className="mt-4 space-y-3">
                {[
                  ['Players online', live.playersOnline.toLocaleString()],
                  ['Active sessions', live.activeSessions.toLocaleString()],
                  ['Regions healthy', `${statuses.filter((s) => s.status === 'operational').length}/${statuses.length}`],
                  ['Average ping', `${live.avgLatency} ms`],
                  ['Queue length', live.queueLength.toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                    <dt className="text-[12.5px] text-[color:var(--text-dim)]">{k}</dt>
                    <dd className="font-mono text-[13.5px] font-bold tabular-nums text-white">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/status" className="btn-ghost mt-5 w-full justify-center !py-2 !text-[12.5px]">
                Full network status
              </Link>
            </div>

            <div className="panel overflow-hidden rounded-2xl">
              <div className="grid grid-cols-4 gap-1 p-1.5">
                {games.slice(0, 8).map((g) => (
                  <Link key={g.id} href={`/games/${g.slug}`} className="aspect-[3/4] overflow-hidden rounded-lg" title={g.title}>
                    <GameArt slug={g.slug} title={g.title} genre={g.genre} accent={g.accent} coverUrl={g.cover_url} rounded={false} />
                  </Link>
                ))}
              </div>
              <div className="border-t border-white/[0.06] px-4 py-3">
                <p className="text-[12.5px] text-[color:var(--text-dim)]">{stats.gamesHosted} titles in the catalogue</p>
                <Link href="/games" className="text-[12px] font-semibold text-brand-300 hover:text-brand-200">Browse all games →</Link>
              </div>
            </div>
          </aside>
        </div>

        <Reveal className="mt-16">
          <h2 className="h-display text-[26px] sm:text-[34px]">How we got here</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {timeline.map((t, i) => (
              <div key={t.year} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">{t.year}</span>
                <h3 className="mt-2 text-[15px] font-semibold text-white">{t.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{t.copy}</p>
                <span className="absolute right-4 top-4 font-mono text-[11px] text-white/15">0{i + 1}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-16">
          <h2 className="h-display text-[26px] sm:text-[34px]">The stack behind it</h2>
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stack.map((s) => (
              <div key={s.title} className="card-hover rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-brand-200">{s.icon}</span>
                <h3 className="mt-3.5 text-[14.5px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{s.copy}</p>
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
