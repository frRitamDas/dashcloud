'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { adminApi } from './api';
import type { ServiceStatusRow } from './types';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Modal';
import { IconBolt, IconCheck, IconRefresh, IconServer, IconWarning } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const STATUSES: ServiceStatusRow['status'][] = ['operational', 'degraded', 'partial', 'down', 'maintenance'];

const statusTone: Record<ServiceStatusRow['status'], string> = {
  operational: 'border-[rgba(74,222,128,0.45)] bg-[rgba(74,222,128,0.14)] text-[#86efac]',
  degraded: 'border-[rgba(251,191,36,0.45)] bg-[rgba(251,191,36,0.14)] text-[#fcd34d]',
  partial: 'border-[rgba(253,164,175,0.45)] bg-[rgba(253,164,175,0.14)] text-[#fda4af]',
  down: 'border-[rgba(251,113,133,0.5)] bg-[rgba(251,113,133,0.16)] text-[#fb7185]',
  maintenance: 'border-[rgba(125,211,252,0.45)] bg-[rgba(125,211,252,0.14)] text-[#7dd3fc]',
};

export function LivePanel({ statuses, onChanged }: { statuses: ServiceStatusRow[]; onChanged: () => void }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Record<string, Partial<ServiceStatusRow>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Dash is under scheduled maintenance. We will be back shortly.');
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const regions = useMemo(() => statuses.filter((s) => s.region !== 'Global'), [statuses]);
  const services = useMemo(() => statuses.filter((s) => s.region === 'Global'), [statuses]);
  const dirtyCount = Object.keys(rows).filter((id) => Object.keys(rows[id]).length > 0).length;

  function draft(s: ServiceStatusRow): Partial<ServiceStatusRow> {
    return rows[s.id] ?? {};
  }
  function set(id: string, patch: Partial<ServiceStatusRow>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }
  function reset(id: string) {
    setRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function save(s: ServiceStatusRow) {
    const patch = draft(s);
    if (Object.keys(patch).length === 0) return;
    setBusy(s.id);
    try {
      await adminApi('/api/admin/status', { method: 'PATCH', body: { id: s.id, ...patch } });
      push(`${s.service || s.region} updated — live on the status page`, 'success');
      reset(s.id);
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function setAllOperational() {
    setBulkBusy(true);
    try {
      for (const s of statuses.filter((x) => x.status !== 'operational')) {
        await adminApi('/api/admin/status', { method: 'PATCH', body: { id: s.id, status: 'operational', message: 'Operating normally.' } });
      }
      push('All components marked operational', 'success');
      onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Bulk update failed', 'error');
    } finally {
      setBulkBusy(false);
      setConfirmBulk(false);
    }
  }

  async function toggleMaintenance(next: boolean) {
    setMaintenance(next);
    try {
      await adminApi('/api/admin/settings', {
        method: 'PATCH',
        body: { key: 'maintenance', value: { enabled: next, message: maintenanceMessage }, is_public: true },
      });
      push(next ? 'Maintenance mode ON — banner is live' : 'Maintenance mode OFF', next ? 'info' : 'success');
      onChanged();
    } catch (err) {
      setMaintenance(!next);
      push(err instanceof Error ? err.message : 'Could not change maintenance mode', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* maintenance + bulk */}
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[14px] font-semibold tracking-tight text-white">Maintenance mode</h2>
              <Switch checked={maintenance} onChange={toggleMaintenance} label="Maintenance mode" />
              {maintenance && <Badge tone="amber" dot>Live banner</Badge>}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[color:var(--text-faint)]">
              Shows a global banner across every page and blocks new cloud sessions from starting.
            </p>
            <textarea
              rows={2}
              className="input mt-3 resize-none"
              value={maintenanceMessage}
              maxLength={200}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Message shown in the banner"
            />
            <button onClick={() => toggleMaintenance(maintenance)} className="btn-ghost mt-2.5 !py-2 !text-[12px]">
              <IconCheck width={14} height={14} /> Push message
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Unsaved changes</p>
              <p className="mt-1 font-mono text-[22px] font-bold tabular-nums text-white">{dirtyCount}</p>
            </div>
            <button onClick={() => setConfirmBulk(true)} disabled={bulkBusy} className="btn-ghost !py-2 !text-[12px]">
              {bulkBusy ? <Spinner size={14} /> : <IconRefresh width={14} height={14} />}
              Mark all operational
            </button>
          </div>
        </div>
      </section>

      {regions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <IconServer width={16} height={16} className="text-brand-300" />
            <h2 className="text-[15px] font-semibold tracking-tight text-white">GPU regions</h2>
            <span className="text-[11.5px] text-[color:var(--text-faint)]">changes push to visitors instantly</span>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {regions.map((s) => (
              <StatusCard key={s.id} row={s} draft={draft(s)} onChange={(patch) => set(s.id, patch)} onSave={() => save(s)} onReset={() => reset(s.id)} busy={busy === s.id} />
            ))}
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <IconBolt width={16} height={16} className="text-neon-mint" />
            <h2 className="text-[15px] font-semibold tracking-tight text-white">Platform services</h2>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {services.map((s) => (
              <StatusCard key={s.id} row={s} draft={draft(s)} onChange={(patch) => set(s.id, patch)} onSave={() => save(s)} onReset={() => reset(s.id)} busy={busy === s.id} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={setAllOperational}
        title="Mark every component operational?"
        message="This overwrites the status and message of all regions and services. Visitors see the change immediately."
        confirmLabel="Mark all operational"
        danger={false}
      />
    </div>
  );
}

function StatusCard({
  row,
  draft,
  onChange,
  onSave,
  onReset,
  busy,
}: {
  row: ServiceStatusRow;
  draft: Partial<ServiceStatusRow>;
  onChange: (patch: Partial<ServiceStatusRow>) => void;
  onSave: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const dirty = Object.keys(draft).length > 0;
  const status = draft.status ?? row.status;
  const load = draft.load_percent ?? row.load_percent;
  const latency = draft.latency_ms ?? row.latency_ms;

  return (
    <motion.div
      layout
      className={cn('rounded-2xl border bg-white/[0.022] p-4 transition-colors', dirty ? 'border-brand-500/45' : 'border-white/[0.07]')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 truncate text-[14px] font-semibold text-white">
            <StatusDot status={status} />
            {row.service || row.region}
          </h3>
          <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[color:var(--text-faint)]">
            {row.region_code} {row.region !== 'Global' && `· ${row.region}`}
          </p>
        </div>
        <AnimatePresence>
          {dirty && (
            <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="shrink-0">
              <Badge tone="brand" dot>Unsaved</Badge>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ status: s })}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold capitalize transition-all',
              status === s ? statusTone[s] : 'border-white/[0.08] bg-white/[0.02] text-[color:var(--text-faint)] hover:text-white',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-faint)]">
            Node load <span className="font-mono text-white/70">{load}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={load}
            onChange={(e) => onChange({ load_percent: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.09] accent-brand-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-faint)]">Latency (ms)</span>
          <input
            type="number"
            min={0}
            max={5000}
            value={latency}
            onChange={(e) => onChange({ latency_ms: Number(e.target.value) })}
            className="input !py-2 font-mono !text-[12.5px]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-faint)]">GPU pool</span>
          <input
            value={draft.gpu_pool ?? row.gpu_pool ?? ''}
            maxLength={80}
            onChange={(e) => onChange({ gpu_pool: e.target.value })}
            className="input !py-2 font-mono !text-[12.5px]"
            placeholder="e.g. RTX 4090 · 48 nodes"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-faint)]">Public message</span>
          <input
            value={draft.message ?? row.message ?? ''}
            maxLength={280}
            onChange={(e) => onChange({ message: e.target.value })}
            className="input !py-2 !text-[12.5px]"
            placeholder="Shown on the status page"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-faint)]">
          {status !== 'operational' && <IconWarning width={12} height={12} className="text-[#fcd34d]" />}
          Players pick this up through Supabase realtime — no refresh needed.
        </p>
        <div className="flex gap-2">
          {dirty && (
            <button onClick={onReset} className="btn-ghost !py-2 !text-[12px]">
              Reset
            </button>
          )}
          <button onClick={onSave} disabled={!dirty || busy} className="btn-primary !py-2 !text-[12px] disabled:opacity-40">
            {busy && <Spinner size={13} />}
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
