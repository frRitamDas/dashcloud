'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from './api';
import type { AnnouncementRow, SettingRow } from './types';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconBell, IconCheck, IconEdit, IconKey, IconPlus, IconSave, IconShield, IconTrash } from '@/components/ui/Icons';
import { cn, timeAgo } from '@/lib/utils';

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown, fallback = 0) => (typeof v === 'number' ? v : Number(v ?? fallback) || fallback);

export function SettingsPanel({
  settings,
  announcements,
  onChanged,
}: {
  settings: SettingRow[];
  announcements: AnnouncementRow[];
  onChanged: () => void;
}) {
  const { push } = useToast();
  const byKey = useMemo(() => Object.fromEntries(settings.map((s) => [s.key, s.value ?? {}])) as Record<string, Record<string, unknown>>, [settings]);

  const [site, setSite] = useState<Record<string, unknown>>(byKey.site ?? {});
  const [stats, setStats] = useState<Record<string, unknown>>(byKey.stats ?? {});
  const [streaming, setStreaming] = useState<Record<string, unknown>>(byKey.streaming ?? {});
  const [adminCfg, setAdminCfg] = useState<Record<string, unknown>>(byKey.admin ?? {});
  const [maintenance, setMaintenance] = useState<Record<string, unknown>>(byKey.maintenance ?? { enabled: false, message: '' });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setSite(byKey.site ?? {});
    setStats(byKey.stats ?? {});
    setStreaming(byKey.streaming ?? {});
    setAdminCfg(byKey.admin ?? {});
    setMaintenance(byKey.maintenance ?? { enabled: false, message: '' });
  }, [byKey]);

  async function save(key: string, value: Record<string, unknown>, isPublic = true) {
    setSaving(key);
    try {
      await adminApi('/api/admin/settings', { method: 'PATCH', body: { key, value, is_public: isPublic } });
      push(`${key} settings saved`, 'success');
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* site identity */}
      <Card
        title="Site identity"
        copy="Used in the navbar, footer, metadata and emails."
        action={<SaveButton busy={saving === 'site'} onClick={() => save('site', site)} />}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <L label="Short name">
            <input className="input" value={str(site.name)} maxLength={40} onChange={(e) => setSite({ ...site, name: e.target.value })} />
          </L>
          <L label="Full name">
            <input className="input" value={str(site.fullName)} maxLength={80} onChange={(e) => setSite({ ...site, fullName: e.target.value })} />
          </L>
          <L label="Tagline" className="sm:col-span-2">
            <input className="input" value={str(site.tagline)} maxLength={120} onChange={(e) => setSite({ ...site, tagline: e.target.value })} />
          </L>
          <L label="Meta description" className="sm:col-span-2">
            <textarea rows={2} className="input resize-none" value={str(site.description)} maxLength={300} onChange={(e) => setSite({ ...site, description: e.target.value })} />
          </L>
          <L label="Support email">
            <input type="email" className="input font-mono" value={str(site.supportEmail)} maxLength={120} onChange={(e) => setSite({ ...site, supportEmail: e.target.value })} />
          </L>
          <L label="Credits line">
            <input className="input" value={str(site.credits)} maxLength={120} onChange={(e) => setSite({ ...site, credits: e.target.value })} />
          </L>
        </div>
      </Card>

      {/* public stats */}
      <Card
        title="Published statistics"
        copy="The numbers shown in the homepage stats band and pricing page."
        action={<SaveButton busy={saving === 'stats'} onClick={() => save('stats', stats)} />}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <L label="Total players">
            <input type="number" min={0} className="input font-mono" value={num(stats.totalPlayers)} onChange={(e) => setStats({ ...stats, totalPlayers: Number(e.target.value) })} />
          </L>
          <L label="Games hosted">
            <input type="number" min={0} className="input font-mono" value={num(stats.gamesHosted)} onChange={(e) => setStats({ ...stats, gamesHosted: Number(e.target.value) })} />
          </L>
          <L label="Countries served">
            <input type="number" min={0} className="input font-mono" value={num(stats.countries)} onChange={(e) => setStats({ ...stats, countries: Number(e.target.value) })} />
          </L>
          <L label="Average boot (seconds)">
            <input type="number" min={0} step="0.5" className="input font-mono" value={num(stats.avgBootSeconds)} onChange={(e) => setStats({ ...stats, avgBootSeconds: Number(e.target.value) })} />
          </L>
          <L label="Uptime percent" className="sm:col-span-2">
            <input type="number" min={0} max={100} step="0.01" className="input font-mono" value={num(stats.uptimePercent)} onChange={(e) => setStats({ ...stats, uptimePercent: Number(e.target.value) })} />
          </L>
        </div>
      </Card>

      {/* streaming */}
      <Card
        title="Streaming defaults"
        copy="Shown to players in the launcher and used as fallback when a region reports nothing."
        action={<SaveButton busy={saving === 'streaming'} onClick={() => save('streaming', streaming)} />}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <L label="Default resolution">
            <select className="input" value={str(streaming.defaultResolution)} onChange={(e) => setStreaming({ ...streaming, defaultResolution: e.target.value })}>
              {['720p60', '1080p60', '1440p60', '2160p60'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </L>
          <L label="Maximum resolution">
            <select className="input" value={str(streaming.maxResolution)} onChange={(e) => setStreaming({ ...streaming, maxResolution: e.target.value })}>
              {['1080p60', '1440p60', '2160p60', '2160p120'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </L>
          <L label="Default bitrate (Mbps)">
            <input type="number" min={1} max={200} className="input font-mono" value={num(streaming.defaultBitrateMbps, 25)} onChange={(e) => setStreaming({ ...streaming, defaultBitrateMbps: Number(e.target.value) })} />
          </L>
          <L label="Codec">
            <input className="input font-mono" value={str(streaming.codec)} maxLength={60} onChange={(e) => setStreaming({ ...streaming, codec: e.target.value })} />
          </L>
          <L label="Transport" className="sm:col-span-2">
            <input className="input font-mono" value={str(streaming.transport)} maxLength={60} onChange={(e) => setStreaming({ ...streaming, transport: e.target.value })} />
          </L>
        </div>
      </Card>

      {/* platform policy */}
      <Card
        title="Platform policy"
        copy="Session limits, queue behaviour and the global maintenance banner."
        action={<SaveButton busy={saving === 'admin'} onClick={async () => { await save('admin', adminCfg, false); await save('maintenance', maintenance); }} />}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <L label="Max session (minutes)">
            <input type="number" min={5} max={1440} className="input font-mono" value={num(adminCfg.maxSessionMinutes, 120)} onChange={(e) => setAdminCfg({ ...adminCfg, maxSessionMinutes: Number(e.target.value) })} />
          </L>
          <L label="Queue priority">
            <select className="input" value={str(adminCfg.queuePriority) || 'balanced'} onChange={(e) => setAdminCfg({ ...adminCfg, queuePriority: e.target.value })}>
              <option value="balanced">balanced</option>
              <option value="paid-first">paid-first</option>
              <option value="fifo">fifo</option>
            </select>
          </L>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-[12.5px] font-semibold text-white">Auto-scale GPU pool</p>
              <p className="mt-0.5 text-[11.5px] text-[color:var(--text-faint)]">Spin up spare nodes when regional load passes 85%.</p>
            </div>
            <Switch checked={Boolean(adminCfg.autoScale)} onChange={(v) => setAdminCfg({ ...adminCfg, autoScale: v })} label="Auto scale" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(251,191,36,0.22)] bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-[12.5px] font-semibold text-[#fcd34d]">Maintenance mode</p>
              <p className="mt-0.5 text-[11.5px] text-[color:var(--text-faint)]">Shows a site-wide banner and blocks new cloud launches.</p>
            </div>
            <Switch checked={Boolean(maintenance.enabled)} onChange={(v) => setMaintenance({ ...maintenance, enabled: v })} label="Maintenance mode" />
          </div>
          <L label="Maintenance message" className="sm:col-span-2">
            <textarea rows={2} className="input resize-none" value={str(maintenance.message)} maxLength={200} onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })} />
          </L>
        </div>
      </Card>

      {/* announcements */}
      <AnnouncementsCard announcements={announcements} onChanged={onChanged} />

      {/* security */}
      <PasswordCard />
    </div>
  );
}

function Card({ title, copy, action, children }: { title: string; copy: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">{copy}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function L({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function SaveButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="btn-primary shrink-0 !py-2 !text-[12px]">
      {busy ? <Spinner size={13} /> : <IconSave width={13} height={13} />}
      {busy ? 'Saving' : 'Save'}
    </button>
  );
}

function AnnouncementsCard({ announcements, onChanged }: { announcements: AnnouncementRow[]; onChanged: () => void }) {
  const { push } = useToast();
  const [list, setList] = useState<AnnouncementRow[]>(announcements);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', kind: 'info' as AnnouncementRow['kind'], link: '', active: true });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AnnouncementRow | null>(null);

  useEffect(() => setList(announcements), [announcements]);

  function startCreate() {
    setForm({ title: '', body: '', kind: 'info', link: '', active: true });
    setCreating(true);
    setEditing(null);
  }
  function startEdit(a: AnnouncementRow) {
    setForm({ title: a.title, body: a.body ?? '', kind: a.kind, link: a.link ?? '', active: a.active });
    setEditing(a);
    setCreating(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { title: form.title.trim(), body: form.body.trim() || null, kind: form.kind, link: form.link.trim() || null, active: form.active };
      if (editing) {
        const { announcement } = await adminApi<{ announcement: AnnouncementRow }>(`/api/admin/announcements/${editing.id}`, { method: 'PATCH', body: payload });
        setList((prev) => prev.map((a) => (a.id === announcement.id ? announcement : a)));
        push('Announcement updated', 'success');
      } else {
        const { announcement } = await adminApi<{ announcement: AnnouncementRow }>('/api/admin/announcements', { method: 'POST', body: payload });
        setList((prev) => [announcement, ...prev]);
        push('Announcement published', 'success');
      }
      setCreating(false);
      setEditing(null);
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(a: AnnouncementRow) {
    try {
      const { announcement } = await adminApi<{ announcement: AnnouncementRow }>(`/api/admin/announcements/${a.id}`, { method: 'PATCH', body: { active: !a.active } });
      setList((prev) => prev.map((x) => (x.id === a.id ? announcement : x)));
      push(announcement.active ? 'Announcement is live' : 'Announcement hidden', 'info');
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    try {
      await adminApi(`/api/admin/announcements/${confirmDelete.id}`, { method: 'DELETE' });
      setList((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      push('Announcement deleted', 'info');
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-white">
            <IconBell width={15} height={15} className="text-brand-300" /> Announcements
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[color:var(--text-faint)]">Active items appear in the site-wide ticker in real time.</p>
        </div>
        <button onClick={startCreate} className="btn-primary shrink-0 !py-2 !text-[12px]">
          <IconPlus width={13} height={13} /> New
        </button>
      </div>

      <div className="space-y-2">
        {list.length === 0 && <p className="py-6 text-center text-[12.5px] text-[color:var(--text-faint)]">No announcements yet.</p>}
        <AnimatePresence initial={false}>
          {list.map((a) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <div className="flex items-center gap-2">
                <Badge tone={a.kind === 'danger' ? 'rose' : a.kind === 'warning' ? 'amber' : a.kind === 'success' ? 'mint' : 'brand'}>{a.kind}</Badge>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-white">{a.title}</span>
                <span className="shrink-0 text-[10.5px] text-[color:var(--text-faint)]">{timeAgo(a.created_at)}</span>
              </div>
              {a.body && <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-[color:var(--text-dim)]">{a.body}</p>}
              <div className="mt-2.5 flex items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] text-[color:var(--text-dim)]">
                  <Switch checked={a.active} onChange={() => toggle(a)} label="Active" /> Active
                </label>
                <button onClick={() => startEdit(a)} className="btn-ghost ml-auto !px-2.5 !py-1.5">
                  <IconEdit width={13} height={13} />
                </button>
                <button onClick={() => setConfirmDelete(a)} className="btn-ghost !px-2.5 !py-1.5 hover:!border-[rgba(251,113,133,0.4)] hover:!text-[#fda4af]">
                  <IconTrash width={13} height={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={editing ? 'Edit announcement' : 'New announcement'}
        description="Pushed to every visitor through Supabase realtime the moment you save."
        footer={
          <>
            <button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="btn-ghost">Cancel</button>
            <button type="submit" form="announcement-form" disabled={busy} className="btn-primary">
              {busy && <Spinner size={15} />} {editing ? 'Save changes' : 'Publish'}
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={submit} className="space-y-4">
          <L label="Title">
            <input required minLength={3} maxLength={140} className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New region live in Tokyo" />
          </L>
          <L label="Body">
            <textarea rows={3} maxLength={600} className="input resize-none" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </L>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <L label="Kind">
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as AnnouncementRow['kind'] })}>
                <option value="info">info</option>
                <option value="success">success</option>
                <option value="warning">warning</option>
                <option value="danger">danger</option>
              </select>
            </L>
            <L label="Link (optional)">
              <input maxLength={200} className="input font-mono" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/status" />
            </L>
          </div>
          <label className="flex items-center gap-2.5 text-[12.5px] text-[color:var(--text-dim)]">
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" /> Show immediately
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        title="Delete this announcement?"
        message="It disappears from the ticker for every visitor immediately."
        confirmLabel="Delete"
      />
    </section>
  );
}

function PasswordCard() {
  const { push } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      push('New passwords do not match', 'error');
      return;
    }
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      push('Use at least 8 characters with a letter and a number', 'error');
      return;
    }
    setBusy(true);
    try {
      await adminApi<{ ok: boolean; reauthenticate?: boolean }>('/api/admin/password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      push('Password changed — sign in again', 'success');
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 900);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Password change failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[rgba(109,92,255,0.24)] bg-[linear-gradient(180deg,rgba(109,92,255,0.08),rgba(109,92,255,0.02))] p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-400/30 bg-brand-500/14 text-brand-200">
          <IconShield width={16} height={16} />
        </span>
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-white">Operator security</h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
            Changing the password invalidates the current session cookie and forces a fresh sign-in.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-3.5 sm:grid-cols-2">
        <L label="Current password" className="sm:col-span-2">
          <input type="password" required className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </L>
        <L label="New password">
          <input type="password" required minLength={8} className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </L>
        <L label="Confirm new password">
          <input type="password" required minLength={8} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </L>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={busy} className="btn-primary !py-2.5 !text-[12.5px]">
            {busy ? <Spinner size={14} /> : <IconKey width={14} height={14} />}
            Change password
          </button>
          <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-faint)]">
            <IconCheck width={12} height={12} className="text-neon-mint" /> Stored salted & hashed
          </span>
        </div>
      </form>
    </section>
  );
}
