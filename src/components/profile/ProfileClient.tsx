'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Game, Profile, ScoreRow } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';
import { GameArt } from '@/components/art/GameArt';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Skeleton';
import {
  IconBolt,
  IconChart,
  IconCheck,
  IconClock,
  IconCoins,
  IconGamepad,
  IconHeart,
  IconLogout,
  IconPlay,
  IconSettings,
  IconTrophy,
  IconUser,
} from '@/components/ui/Icons';
import { cn, formatDuration, initials, timeAgo, withAlpha, xpProgress } from '@/lib/utils';

type Tab = 'overview' | 'library' | 'scores' | 'settings';

export function ProfileClient({
  profile,
  email,
  favourites,
  scores,
  initialTab = 'overview',
}: {
  profile: Profile;
  email: string;
  favourites: Game[];
  scores: ScoreRow[];
  initialTab?: Tab;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [draft, setDraft] = useState({
    display_name: profile.display_name ?? '',
    username: profile.username ?? '',
    country: profile.country ?? 'IN',
    bio: profile.bio ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const progress = xpProgress(profile.xp);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabaseBrowser()
      .from('profiles')
      .update({
        display_name: draft.display_name.trim().slice(0, 60) || null,
        username: draft.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || null,
        country: draft.country.trim().toUpperCase().slice(0, 2) || 'IN',
        bio: draft.bio.trim().slice(0, 280) || null,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      push(error.message.includes('duplicate') ? 'That player name is already taken.' : error.message, 'error');
      return;
    }
    push('Profile updated', 'success');
    router.refresh();
  }

  async function removeFavourite(game: Game) {
    await supabaseBrowser().from('favorites').delete().eq('user_id', profile.id).eq('game_id', game.id);
    push(`Removed ${game.title}`, 'info');
    router.refresh();
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="section py-10 lg:py-14">
      {/* ---------- header ---------- */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-[20px] font-bold text-white shadow-glow">
              {initials(profile.display_name || profile.username || email)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-semibold tracking-tight text-white sm:text-[28px]">
                {profile.display_name || profile.username || 'Player'}
              </h1>
              <p className="mt-1 truncate text-[13px] text-[color:var(--text-faint)]">
                {profile.username ? `@${profile.username}` : email} · {email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="chip !border-brand-500/35 !bg-brand-500/12 !text-brand-100">
                  <IconTrophy width={11} height={11} /> Level {profile.level}
                </span>
                <span className="chip">
                  <IconCoins width={11} height={11} className="text-neon-amber" /> {profile.coins.toLocaleString()} coins
                </span>
                <span className="chip">
                  <IconGamepad width={11} height={11} /> {profile.games_played} sessions
                </span>
                {profile.is_pro && <span className="chip !border-[rgba(251,191,36,0.35)] !bg-[rgba(251,191,36,0.12)] !text-[#fcd34d]">Dash Plus</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/games?mode=native" className="btn-primary !py-2.5 !text-[13px]">
              <IconPlay width={14} height={14} /> Play now
            </Link>
            <button onClick={() => setConfirmSignOut(true)} className="btn-ghost !py-2.5 !text-[13px]">
              <IconLogout width={14} height={14} /> Sign out
            </button>
          </div>
        </div>

        <div className="relative mt-7">
          <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-[color:var(--text-faint)]">
            <span>
              Level {profile.level} → {profile.level + 1}
            </span>
            <span className="font-mono tabular-nums">
              {progress.current.toLocaleString()} / {progress.needed.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-neon-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <dl className="relative mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total XP', value: profile.xp.toLocaleString(), icon: <IconChart width={13} height={13} /> },
            { label: 'Play time', value: formatDuration(profile.total_play_seconds), icon: <IconClock width={13} height={13} /> },
            { label: 'Favourites', value: String(favourites.length), icon: <IconHeart width={13} height={13} /> },
            { label: 'Runs submitted', value: String(scores.length), icon: <IconBolt width={13} height={13} /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.022] px-4 py-3">
              <dt className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                {s.icon}
                {s.label}
              </dt>
              <dd className="mt-1 font-mono text-[19px] font-bold tabular-nums text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
      </motion.header>

      {/* ---------- tabs ---------- */}
      <Tabs
        className="mt-7"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview', icon: <IconUser width={14} height={14} /> },
          { id: 'library', label: 'Library', icon: <IconHeart width={14} height={14} />, badge: favourites.length },
          { id: 'scores', label: 'My runs', icon: <IconTrophy width={14} height={14} />, badge: scores.length },
          { id: 'settings', label: 'Settings', icon: <IconSettings width={14} height={14} /> },
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6"
        >
          {tab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section>
                <h2 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Recent runs</h2>
                {scores.length === 0 ? (
                  <EmptyCard
                    title="No runs recorded yet"
                    copy="Finish a game and your score lands here plus on the global leaderboard."
                    cta={{ href: '/games?mode=native', label: 'Play something' }}
                  />
                ) : (
                  <div className="panel divide-y divide-white/[0.05] overflow-hidden rounded-2xl">
                    {scores.slice(0, 8).map((row) => (
                      <div key={row.id} className="flex items-center gap-3.5 px-4 py-3.5">
                        <span className="h-9 w-7 shrink-0 overflow-hidden rounded">
                          {row.games && (
                            <GameArt slug={row.games.slug} title={row.games.title} genre="arcade" accent={row.games.accent} rounded={false} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-white">{row.games?.title ?? 'Game'}</span>
                          <span className="block text-[11.5px] text-[color:var(--text-faint)]">
                            {row.metric} · {timeAgo(row.created_at)}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[15px] font-bold tabular-nums" style={{ color: row.games?.accent ?? '#fff' }}>
                          {row.score.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <div className="panel rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-white">Rewards</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                    You earn XP and Dash Coins automatically for every session longer than 30 seconds and every score you submit.
                  </p>
                  <ul className="mt-4 space-y-2.5 text-[12.5px] text-[color:var(--text-dim)]">
                    {[
                      'Session XP — up to 240 per run',
                      'Score bonus — up to 120 XP',
                      'Coins — 1 per 30 seconds played',
                      'Coins unlock Dash Plus & Ultra',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <IconCheck width={14} height={14} className="mt-[2px] shrink-0 text-neon-mint" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className="btn-ghost mt-5 w-full justify-center !py-2 !text-[12.5px]">
                    See plans
                  </Link>
                </div>
                <div className="panel rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-white">Account</h3>
                  <dl className="mt-3 space-y-2 text-[12.5px]">
                    <Row k="Member since" v={new Date(profile.created_at).toLocaleDateString()} />
                    <Row k="Last seen" v={timeAgo(profile.last_seen_at)} />
                    <Row k="Region" v={profile.country ?? 'IN'} />
                    <Row k="Plan" v={profile.is_pro ? 'Dash Plus' : 'Free'} />
                  </dl>
                </div>
              </aside>
            </div>
          )}

          {tab === 'library' && (
            <section>
              {favourites.length === 0 ? (
                <EmptyCard
                  title="Your library is empty"
                  copy="Tap the heart on any game to keep it here for one-click access."
                  cta={{ href: '/games', label: 'Browse the catalogue' }}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {favourites.map((g) => (
                    <div key={g.id} className="card-hover group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022]">
                      <Link href={`/games/${g.slug}`} className="flex gap-3.5 p-3">
                        <span className="h-20 shrink-0 overflow-hidden rounded-xl" style={{ width: 60 }}>
                          <GameArt slug={g.slug} title={g.title} genre={g.genre} accent={g.accent} coverUrl={g.cover_url} rounded={false} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold text-white">{g.title}</span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-[color:var(--text-faint)]">{g.tagline}</span>
                          <span className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: g.accent }}>
                            <IconPlay width={11} height={11} /> {g.play_mode === 'native' ? 'Instant play' : 'Cloud stream'}
                          </span>
                        </span>
                      </Link>
                      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2">
                        <Link href={`/play/${g.slug}`} className="text-[12px] font-semibold text-white/70 transition-colors hover:text-white">
                          Launch
                        </Link>
                        <button onClick={() => removeFavourite(g)} className="text-[12px] text-[color:var(--text-faint)] transition-colors hover:text-[#fda4af]">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'scores' && (
            <section>
              {scores.length === 0 ? (
                <EmptyCard title="No scores yet" copy="Play an instant title and your best run will be stored here." cta={{ href: '/games?mode=native', label: 'Start playing' }} />
              ) : (
                <div className="panel overflow-hidden rounded-2xl">
                  <div className="hidden grid-cols-[1fr_120px_110px_120px] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] sm:grid">
                    <span>Title</span>
                    <span>Metric</span>
                    <span className="text-right">Score</span>
                    <span className="text-right">Submitted</span>
                  </div>
                  {scores.map((row) => (
                    <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3.5 last:border-0 sm:grid-cols-[1fr_120px_110px_120px]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="h-8 w-6 shrink-0 overflow-hidden rounded">
                          {row.games && <GameArt slug={row.games.slug} title={row.games.title} genre="arcade" accent={row.games.accent} rounded={false} />}
                        </span>
                        <span className="truncate text-[13.5px] font-semibold text-white">{row.games?.title ?? 'Game'}</span>
                      </span>
                      <span className="hidden text-[12px] capitalize text-[color:var(--text-faint)] sm:block">{row.metric}</span>
                      <span className="text-right font-mono text-[14px] font-bold tabular-nums" style={{ color: row.games?.accent ?? '#fff' }}>
                        {row.score.toLocaleString()}
                      </span>
                      <span className="hidden text-right text-[11.5px] text-[color:var(--text-faint)] sm:block">{timeAgo(row.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'settings' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <form onSubmit={save} className="panel rounded-2xl p-6">
                <h2 className="text-[16px] font-semibold tracking-tight text-white">Profile details</h2>
                <p className="mt-1.5 text-[12.5px] text-[color:var(--text-faint)]">Shown on leaderboards and your public player card.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="display_name">Display name</label>
                    <input id="display_name" className="input" value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} maxLength={60} />
                  </div>
                  <div>
                    <label className="label" htmlFor="username">Username</label>
                    <input id="username" className="input" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} maxLength={24} />
                    <p className="mt-1.5 text-[11px] text-[color:var(--text-faint)]">Lowercase letters, numbers and underscores.</p>
                  </div>
                  <div>
                    <label className="label" htmlFor="country">Country code</label>
                    <input id="country" className="input" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} maxLength={2} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="bio">Bio</label>
                    <textarea id="bio" rows={3} className="input resize-none" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={280} />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving && <Spinner size={15} />}
                    Save changes
                  </button>
                  <button type="button" onClick={() => setDraft({ display_name: profile.display_name ?? '', username: profile.username ?? '', country: profile.country ?? 'IN', bio: profile.bio ?? '' })} className="btn-ghost">
                    Reset
                  </button>
                </div>
              </form>

              <aside className="space-y-4">
                <div className="panel rounded-2xl p-5">
                  <h3 className="text-[14px] font-semibold text-white">Session</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                    Signed in as <span className="font-mono text-white/80">{email}</span>. Sessions expire after two hours of inactivity and refresh automatically.
                  </p>
                  <button onClick={() => setConfirmSignOut(true)} className="btn-ghost mt-4 w-full justify-center !py-2 !text-[12.5px]">
                    <IconLogout width={14} height={14} /> Sign out of this device
                  </button>
                </div>
                <div className="rounded-2xl border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.05)] p-5">
                  <h3 className="text-[14px] font-semibold text-[#fda4af]">Data & privacy</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
                    Your profile, scores and session history live in your own Supabase project. Row-level security means only
                    you can edit your row; the public only sees your display name on leaderboards.
                  </p>
                  <Link href="/privacy" className="btn-ghost mt-4 w-full justify-center !py-2 !text-[12.5px]">
                    Read the privacy policy
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={signOut}
        title="Sign out of Dash?"
        message="Your cloud saves stay safe. You can sign back in from any device and continue where you left off."
        confirmLabel="Sign out"
        danger={false}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
      <dt className="text-[color:var(--text-faint)]">{k}</dt>
      <dd className="font-mono text-white/85">{v}</dd>
    </div>
  );
}

function EmptyCard({ title, copy, cta }: { title: string; copy: string; cta: { href: string; label: string } }) {
  return (
    <div className="panel flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
      <span className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]')}>
        <IconHeart width={20} height={20} className="text-[color:var(--text-faint)]" />
      </span>
      <h3 className="text-[16px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] text-[color:var(--text-dim)]">{copy}</p>
      <Link href={cta.href} className="btn-primary mt-5">
        {cta.label}
      </Link>
    </div>
  );
}

export { withAlpha };
