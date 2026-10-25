'use client';

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
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: { username: username.trim(), password } });
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Check your details and try again.');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark size={34} />
          <div><p className="text-sm font-bold text-white">Dash Cloud</p><p className="mt-0.5 text-xs text-neutral-500">Administration</p></div>
        </div>

        <section className="border border-white/15 bg-[#0b0b0b] p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-500">Restricted access</p>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.045em] text-white">Sign in to the console</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">This area is for authorized Dash Cloud operators.</p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <label className="label" htmlFor="a-user">Username</label>
              <div className="relative">
                <IconUser width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input id="a-user" ref={userRef} className="input !pl-10" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required maxLength={40} placeholder="Username" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="a-pass">Password</label>
              <div className="relative">
                <IconLock width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input id="a-pass" type={show ? 'text' : 'password'} className="input !pl-10 !pr-11" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required maxLength={200} placeholder="Password" />
                <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-white"><IconEye width={16} height={16} /></button>
              </div>
            </div>

            {error && <p role="alert" className="border border-white/20 bg-white/[0.04] px-3.5 py-3 text-sm leading-6 text-neutral-200">{error}</p>}

            <button type="submit" disabled={busy || !username.trim() || !password} className="btn-primary w-full !py-3 !text-sm">
              {busy ? <><Spinner size={15} /> Verifying credentials…</> : <>Sign in <IconKey width={15} height={15} /></>}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5">
            <IconShield width={16} height={16} className="mt-0.5 shrink-0 text-neutral-400" />
            <p className="text-xs leading-5 text-neutral-500">Admin sessions use signed, HTTP-only cookies and expire automatically. Sign-in attempts are rate-limited and recorded for review.</p>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-neutral-600">Not an operator? <Link href="/" className="text-neutral-300 underline decoration-neutral-700 underline-offset-4 hover:text-white">Return to the public site</Link></p>
      </div>
    </main>
  );
}
