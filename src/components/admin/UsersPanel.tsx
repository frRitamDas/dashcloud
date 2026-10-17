'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import type { ProfileRowAdmin } from './types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconBan, IconCheck, IconCoins, IconSearch, IconUsers } from '@/components/ui/Icons';
import { cn, formatDuration, initials, timeAgo } from '@/lib/utils';

const PER_PAGE = 25;

export function UsersPanel() {
  const { push } = useToast();
  const [users, setUsers] = useState<ProfileRowAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProfileRowAdmin | null>(null);
  const [coins, setCoins] = useState(0);
  const [xp, setXp] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ users: ProfileRowAdmin[]; total: number }>('/api/admin/users', { query: { q, page, perPage: PER_PAGE } });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load players', 'error');
    } finally {
      setLoading(false);
    }
  }, [q, page, push]);

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  async function patch(u: ProfileRowAdmin, body: Record<string, unknown>, message: string) {
    setBusy(u.id);
    try {
      await adminApi('/api/admin/users', { method: 'PATCH', body: { id: u.id, ...body } });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? ({ ...x, ...body } as ProfileRowAdmin) : x)));
      push(message, 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function openEdit(u: ProfileRowAdmin) {
    setEditing(u);
    setCoins(u.coins);
    setXp(u.xp);
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="input !pl-10 !py-2.5 !text-[13px]" placeholder="Search username…" />
        </div>
        <span className="text-[12px] text-[color:var(--text-faint)]">
          {total.toLocaleString()} player{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022]">
        <div className="hidden grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] lg:grid">
          <span>Player</span>
          <span>Level / XP</span>
          <span>Coins</span>
          <span>Play time</span>
          <span>Last seen</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-[12.5px] text-[color:var(--text-faint)]">
            <Spinner size={15} /> Loading players…
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <IconUsers width={22} height={22} className="text-[color:var(--text-faint)]" />
            </span>
            <h3 className="text-[16px] font-semibold text-white">No players found</h3>
            <p className="mt-1.5 text-[13px] text-[color:var(--text-dim)]">Accounts appear here the moment someone signs up.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {users.map((u) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3.5 last:border-0 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white', u.is_banned ? 'bg-[rgba(251,113,133,0.22)]' : 'bg-gradient-to-br from-brand-400 to-brand-700')}>
                    {initials(u.display_name || u.username || u.id)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-white">{u.display_name || u.username || 'Unnamed'}</span>
                      {u.is_pro && <Badge tone="amber">Plus</Badge>}
                      {u.is_banned && <Badge tone="rose">Banned</Badge>}
                    </span>
                    <span className="block truncate font-mono text-[10.5px] text-[color:var(--text-faint)]">
                      {u.username ? `@${u.username}` : u.id.slice(0, 12)} · {u.country ?? '—'}
                    </span>
                  </span>
                </div>

                <div className="hidden lg:block">
                  <p className="font-mono text-[12.5px] tabular-nums text-white/85">Lv {u.level}</p>
                  <p className="font-mono text-[10.5px] text-[color:var(--text-faint)]">{u.xp.toLocaleString()} xp</p>
                </div>
                <p className="hidden font-mono text-[12.5px] tabular-nums text-neon-amber lg:block">{u.coins.toLocaleString()}</p>
                <p className="hidden font-mono text-[12.5px] tabular-nums text-white/70 lg:block">{formatDuration(u.total_play_seconds)}</p>
                <p className="hidden text-[11.5px] text-[color:var(--text-faint)] lg:block">{timeAgo(u.last_seen_at)}</p>

                <div className="flex items-center justify-end gap-1.5">
                  {busy === u.id && <Spinner size={13} />}
                  <button
                    onClick={() => patch(u, { is_pro: !u.is_pro }, `${u.username ?? 'Player'} is now ${u.is_pro ? 'free' : 'Dash Plus'}`)}
                    className="btn-ghost !px-2.5 !py-1.5"
                    title={u.is_pro ? 'Remove Plus' : 'Grant Plus'}
                  >
                    {u.is_pro ? <IconCheck width={14} height={14} className="text-neon-amber" /> : <IconCoins width={14} height={14} />}
                  </button>
                  <button
                    onClick={() => patch(u, { is_banned: !u.is_banned }, u.is_banned ? 'Ban lifted' : 'Player banned')}
                    className={cn('btn-ghost !px-2.5 !py-1.5', u.is_banned ? '!border-[rgba(74,222,128,0.4)] !text-[#86efac]' : 'hover:!border-[rgba(251,113,133,0.4)] hover:!text-[#fda4af]')}
                    title={u.is_banned ? 'Unban' : 'Ban'}
                  >
                    <IconBan width={14} height={14} />
                  </button>
                  <button onClick={() => openEdit(u)} className="btn-ghost !px-2.5 !py-1.5">
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="btn-ghost !py-2 !text-[12px] disabled:opacity-40">
            Previous
          </button>
          <span className="font-mono text-[12px] text-[color:var(--text-faint)]">
            {page} / {pages}
          </span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages || loading} className="btn-ghost !py-2 !text-[12px] disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.display_name || editing.username || 'player'}` : ''}
        description="Adjust economy values directly. Level is recalculated from XP automatically."
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={!editing}
              onClick={async () => {
                if (!editing) return;
                await patch(editing, { coins, xp, is_banned: editing.is_banned }, 'Player updated');
                setEditing(null);
              }}
            >
              Save player
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Display name</span>
              <input
                className="input"
                defaultValue={editing.display_name ?? ''}
                maxLength={60}
                onBlur={(e) => patch(editing, { display_name: e.target.value }, 'Display name updated')}
              />
            </label>
            <label className="block">
              <span className="label">Country</span>
              <input className="input font-mono" value={editing.country ?? '—'} readOnly />
            </label>
            <label className="block">
              <span className="label">Coins</span>
              <input type="number" min={0} className="input font-mono" value={coins} onChange={(e) => setCoins(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="label">XP</span>
              <input type="number" min={0} className="input font-mono" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </label>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 sm:col-span-2">
              <p className="text-[11.5px] text-[color:var(--text-faint)]">
                Sessions played: <span className="font-mono text-white/75">{editing.games_played}</span> · total play time:{' '}
                <span className="font-mono text-white/75">{formatDuration(editing.total_play_seconds)}</span> · joined{' '}
                <span className="font-mono text-white/75">{new Date(editing.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
