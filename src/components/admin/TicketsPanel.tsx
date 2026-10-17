'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import type { TicketRow } from './types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconMail, IconRefresh, IconTicket } from '@/components/ui/Icons';
import { cn, timeAgo } from '@/lib/utils';

const STATUSES: TicketRow['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: TicketRow['priority'][] = ['normal', 'high', 'urgent'];
const FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;

export function TicketsPanel() {
  const { push } = useToast();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [open, setOpen] = useState<TicketRow | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ tickets: TicketRow[] }>('/api/admin/tickets');
      setTickets(data.tickets);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = tickets.filter((t) => (filter === 'all' ? true : t.status === filter));
  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  async function patch(ticket: TicketRow, body: Partial<TicketRow>, message: string) {
    setBusy(true);
    try {
      const { ticket: updated } = await adminApi<{ ticket: TicketRow }>('/api/admin/tickets', { method: 'PATCH', body: { id: ticket.id, ...body } });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated } : t)));
      setOpen((prev) => (prev && prev.id === ticket.id ? { ...prev, ...updated } : prev));
      push(message, 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  function openTicket(t: TicketRow) {
    setOpen(t);
    setReply(t.reply ?? '');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar flex gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-[11.5px] font-medium capitalize transition-colors',
                filter === f ? 'bg-white/[0.09] text-white' : 'text-[color:var(--text-faint)] hover:text-white',
              )}
            >
              {f.replace('_', ' ')} <span className="ml-1 font-mono text-[10.5px] opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-ghost !py-2 !text-[12px]">
          <IconRefresh width={14} height={14} /> Refresh
        </button>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.022] px-5 py-14 text-[12.5px] text-[color:var(--text-faint)]">
          <Spinner size={15} /> Loading tickets…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.022] px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <IconTicket width={22} height={22} className="text-[color:var(--text-faint)]" />
          </span>
          <h3 className="text-[16px] font-semibold text-white">Nothing in this queue</h3>
          <p className="mt-1.5 text-[13px] text-[color:var(--text-dim)]">Tickets submitted from the support page land here instantly.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {visible.map((t) => (
              <motion.button
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => openTicket(t)}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4 text-left transition-colors hover:border-white/[0.16]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={t.status === 'open' ? 'rose' : t.status === 'in_progress' ? 'amber' : t.status === 'resolved' ? 'mint' : 'neutral'} dot={t.status === 'open'}>
                    {t.status.replace('_', ' ')}
                  </Badge>
                  <Badge tone={t.priority === 'urgent' ? 'rose' : t.priority === 'high' ? 'amber' : 'neutral'}>{t.priority}</Badge>
                  <Badge tone="brand">{t.category}</Badge>
                  <span className="ml-auto font-mono text-[10.5px] text-[color:var(--text-faint)]">{t.reference ?? t.id.slice(0, 8)}</span>
                </div>
                <h3 className="mt-2.5 truncate text-[14px] font-semibold text-white">{t.subject}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">{t.body}</p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--text-faint)]">
                  <span>{t.name}</span>
                  <span className="flex items-center gap-1">
                    <IconMail width={11} height={11} /> {t.email}
                  </span>
                  <span>{timeAgo(t.created_at)}</span>
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        size="lg"
        title={open?.subject ?? ''}
        description={
          open ? (
            <span className="font-mono text-[11.5px]">
              {open.reference} · {open.name} · {open.email} · {timeAgo(open.created_at)}
            </span>
          ) : undefined
        }
        footer={
          <>
            <button type="button" onClick={() => setOpen(null)} className="btn-ghost">Close</button>
            <button
              type="button"
              disabled={busy || !open}
              onClick={() => open && patch(open, { reply }, 'Reply saved')}
              className="btn-primary"
            >
              {busy && <Spinner size={15} />} Save reply
            </button>
          </>
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Message</p>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[color:var(--text-dim)]">{open.body}</p>
            </div>

            <div>
              <span className="label">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch(open, { status: s }, `Ticket marked ${s.replace('_', ' ')}`)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold capitalize transition-colors',
                      open.status === s ? 'border-brand-500/50 bg-brand-500/14 text-brand-100' : 'border-white/[0.08] bg-white/[0.02] text-[color:var(--text-faint)] hover:text-white',
                    )}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Priority</span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => patch(open, { priority: p }, `Priority set to ${p}`)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold capitalize transition-colors',
                      open.priority === p ? 'border-brand-500/50 bg-brand-500/14 text-brand-100' : 'border-white/[0.08] bg-white/[0.02] text-[color:var(--text-faint)] hover:text-white',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="reply">Internal reply / resolution note</label>
              <textarea
                id="reply"
                rows={5}
                maxLength={4000}
                className="input resize-none"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="What did you tell the player, or what did you change?"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} className="btn-ghost !py-2 !text-[12px]">
                <IconMail width={14} height={14} /> Email player
              </a>
              <button onClick={() => patch(open, { status: 'resolved', reply: reply || open.reply }, 'Ticket resolved')} className="btn-ghost !py-2 !text-[12px]">
                Mark resolved
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
