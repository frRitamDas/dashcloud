'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { IconCheck, IconMail, IconTicket, IconUser } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Skeleton';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'technical', label: 'Technical — launch, lag, crash' },
  { id: 'account', label: 'Account, sign-in or saves' },
  { id: 'billing', label: 'Billing or subscription' },
  { id: 'report', label: 'Report a player or score' },
  { id: 'other', label: 'Something else' },
];

export function SupportForm() {
  const { user, profile } = useUser();
  const [name, setName] = useState(profile?.display_name ?? profile?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [category, setCategory] = useState('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, category, subject, body: message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Could not submit the ticket.');
      setDone(json.ticket?.reference ?? json.reference ?? null);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="panel rounded-2xl p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.12)]">
          <IconCheck width={22} height={22} className="text-neon-mint" />
        </span>
        <h3 className="text-[18px] font-semibold tracking-tight text-white">Ticket received</h3>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[color:var(--text-dim)]">
          {done ? (
            <>
              Your reference is <span className="font-mono text-white">{done}</span>. An operator will reply to{' '}
              <span className="text-white/80">{email}</span>.
            </>
          ) : (
            'An operator will reply to your email shortly.'
          )}
        </p>
        <button onClick={() => setDone(null)} className="btn-ghost mt-6">
          Submit another ticket
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="panel rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-brand-200">
          <IconTicket width={15} height={15} />
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-white">Support request</p>
          <p className="text-[11.5px] text-[color:var(--text-faint)]">Stored in Postgres · visible to operators only</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="t-name">Name</label>
          <div className="relative">
            <IconUser width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
            <input id="t-name" required maxLength={80} className="input !pl-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="t-email">Email</label>
          <div className="relative">
            <IconMail width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
            <input id="t-email" type="email" required maxLength={160} className="input !pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="label">Category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                'rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-colors',
                category === c.id
                  ? 'border-brand-500/50 bg-brand-500/14 text-brand-100'
                  : 'border-white/[0.08] bg-white/[0.02] text-[color:var(--text-dim)] hover:border-white/[0.18] hover:text-white',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label className="label" htmlFor="t-subject">Subject</label>
        <input id="t-subject" required maxLength={140} className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. DashCraft fails to boot in Mumbai region" />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="t-message">What happened?</label>
        <textarea
          id="t-message"
          required
          rows={6}
          maxLength={4000}
          className="input resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the problem, the steps to reproduce it, your device and browser."
        />
        <p className="mt-1.5 text-right text-[11px] text-[color:var(--text-faint)]">{message.length}/4000</p>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-[rgba(251,113,133,0.28)] bg-[rgba(251,113,133,0.09)] px-3.5 py-2.5 text-[12.5px] text-[#ffc9d1]">
          {error}
        </motion.p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-[color:var(--text-faint)]">Rate limited to 4 tickets per 10 minutes per address.</p>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy && <Spinner size={15} />}
          {busy ? 'Sending…' : 'Submit ticket'}
        </button>
      </div>
    </form>
  );
}
