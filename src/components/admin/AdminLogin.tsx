'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { adminApi } from './api';
import { LogoMark } from '@/components/ui/Logo';
import { IconEye, IconKey, IconLock, IconShield, IconUser } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Skeleton';

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: { username, password } });
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setShake((s) => s + 1);
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/16 blur-[110px]" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.45]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="panel rounded-2xl p-7">
          <div className="flex items-center gap-3">
            <LogoMark size={34} />
            <div>
              <p className="text-[14px] font-bold tracking-tight text-white">Dash Control Plane</p>
              <p className="text-[11px] text-[color:var(--text-faint)]">Operators only</p>
            </div>
          </div>

          <motion.form key={shake} onSubmit={submit} className="mt-7 space-y-4" animate={shake ? { x: [0, -7, 6, -4, 0] } : {}} transition={{ duration: 0.34 }}>
            <div>
              <label className="label" htmlFor="a-user">Username</label>
              <div className="relative">
                <IconUser width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
                <input
                  id="a-user"
                  ref={userRef}
                  className="input !pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  maxLength={40}
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="a-pass">Password</label>
              <div className="relative">
                <IconLock width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
                <input
                  id="a-pass"
                  type={show ? 'text' : 'password'}
                  className="input !pl-10 !pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)] transition-colors hover:text-white">
                  <IconEye width={16} height={16} />
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.09)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#ffc9d1]">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3 !text-[14px]">
              {busy && <Spinner size={15} />}
              {busy ? 'Verifying…' : 'Sign in to console'}
              {!busy && <IconKey width={15} height={15} />}
            </button>
          </motion.form>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.022] px-3.5 py-3">
            <IconShield width={15} height={15} className="mt-[1px] shrink-0 text-neon-mint" />
            <p className="text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
              Sessions are signed, httpOnly and expire after 8 hours. Five failed attempts lock the account for 15
              minutes, and every attempt is written to the audit log.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-[color:var(--text-faint)]">
          Not an operator? <Link href="/" className="underline decoration-white/25 underline-offset-2 hover:text-white">Back to Dash</Link>
        </p>
      </motion.div>
    </div>
  );
}
