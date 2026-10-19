'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { LogoMark } from '@/components/ui/Logo';
import { IconArrowRight, IconCheck, IconLock, IconMail, IconShield, IconUser } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Skeleton';
import { passwordStrength } from '@/lib/password-client';
import { cn } from '@/lib/utils';
import { safeInternalPath } from '@/lib/redirects';

const perks = ['Unlimited instant-play engines', 'Cloud saves & XP on every device', 'Weekly global leaderboards', 'No card, no trial clock'];

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeInternalPath(params.get('next'), '/profile');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const strength = passwordStrength(password);

  useEffect(() => {
    setError(null);
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const sb = supabaseBrowser();

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await sb.auth.signUp({
          email,
          password,
          options: { data: { username: username || email.split('@')[0] } },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setOk('Account created. Check your inbox to confirm, then sign in.');
          setBusy(false);
          return;
        }
        if (data.user) {
          await sb.from('profiles').upsert({
            id: data.user.id,
            username: (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, ''),
            display_name: username || email.split('@')[0],
          });
        }
      } else {
        const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(
        message.includes('Invalid login credentials')
          ? 'That email and password combination does not match an account.'
          : message.includes('already registered')
            ? 'An account with that email already exists — try signing in.'
            : message,
      );
      setBusy(false);
    }
  }

  return (
    <div className="section grid min-h-[calc(100dvh-64px)] items-center gap-12 py-10 lg:grid-cols-2 lg:py-16">
      <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="hidden lg:block">
        <LogoMark size={46} />
        <h2 className="h-display mt-7 text-[38px] leading-[1.08]">
          {mode === 'login' ? 'Welcome back to the cloud.' : 'Your free account unlocks everything.'}
        </h2>
        <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[color:var(--text-dim)]">
          {mode === 'login'
            ? 'Sign in to pick up your saves, XP and Dash Coins exactly where you left them — on any device, in any region.'
            : 'Create an account in ten seconds. No card, no trial clock, no download. Play instantly in the browser and keep your progress in the cloud.'}
        </p>
        <ul className="mt-8 space-y-3">
          {perks.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.07, duration: 0.5 }}
              className="flex items-center gap-3 text-[13.5px] text-[color:var(--text-dim)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[rgba(74,222,128,0.28)] bg-[rgba(74,222,128,0.12)] text-[#86efac]">
                <IconCheck width={12} height={12} />
              </span>
              {p}
            </motion.li>
          ))}
        </ul>
        <div className="mt-9 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.022] px-4 py-3">
          <IconShield width={16} height={16} className="shrink-0 text-neon-mint" />
          <p className="text-[12px] leading-relaxed text-[color:var(--text-faint)]">
            Auth runs on Supabase with row-level security. Passwords never touch our servers — only a session token does.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[440px]"
      >
        <div className="panel rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <LogoMark size={34} />
            <span className="text-[15px] font-bold tracking-tight text-white">Dash</span>
          </div>

          <h1 className="text-[24px] font-semibold tracking-tight text-white">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="mt-1.5 text-[13px] text-[color:var(--text-faint)]">
            {mode === 'login' ? (
              <>
                New to Dash?{' '}
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
                  Create a free account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand-300 underline decoration-brand-500/40 underline-offset-2 hover:text-brand-200">
                  Sign in
                </Link>
              </>
            )}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="username">
                  Player name
                </label>
                <div className="relative">
                  <IconUser width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
                  <input
                    id="username"
                    className="input !pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ritam"
                    autoComplete="nickname"
                    maxLength={24}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <IconMail width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
                <input
                  id="email"
                  type="email"
                  required
                  className="input !pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <IconLock width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={mode === 'signup' ? 8 : 6}
                  className="input !pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors duration-300',
                          i < strength.score ? (strength.score <= 2 ? 'bg-[#fb7185]' : strength.score === 3 ? 'bg-[#fbbf24]' : 'bg-[#4ade80]') : 'bg-white/[0.08]',
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[color:var(--text-faint)]">
                    Strength: <span className="text-white/70">{strength.label}</span> — mix upper case, digits and a symbol.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.09)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#ffc9d1]">
                {error}
              </motion.p>
            )}
            {ok && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[rgba(74,222,128,0.28)] bg-[rgba(74,222,128,0.09)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b7f0cd]">
                {ok}
              </motion.p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5 !text-[14.5px]">
              {busy ? <Spinner size={16} /> : null}
              {mode === 'login' ? 'Sign in' : 'Create free account'}
              {!busy && <IconArrowRight width={16} height={16} />}
            </button>
          </form>

          <p className="mt-5 text-center text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
            By continuing you agree to the{' '}
            <Link href="/terms" className="underline decoration-white/25 underline-offset-2 hover:text-white">Terms</Link> and{' '}
            <Link href="/privacy" className="underline decoration-white/25 underline-offset-2 hover:text-white">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/games?mode=native" className="text-[12.5px] text-[color:var(--text-dim)] underline decoration-white/20 underline-offset-4 transition-colors hover:text-white">
            Skip for now — play as a guest
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
