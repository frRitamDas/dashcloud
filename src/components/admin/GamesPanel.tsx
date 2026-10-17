'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from './api';
import type { AdminGameRow } from './types';
import { GameArt } from '@/components/art/GameArt';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { Spinner, Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconEdit, IconExternal, IconGamepad, IconPlus, IconSearch, IconTrash } from '@/components/ui/Icons';
import { cn, formatNumber } from '@/lib/utils';

const ENGINES = ['voxel-sandbox', 'city-driver', 'neon-snake', 'brick-blaster', 'star-raider', 'dash-2048', 'sky-hop'];

type Draft = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  genre: string;
  tags: string;
  publisher: string;
  release_year: string;
  cover_url: string;
  banner_url: string;
  accent: string;
  rating: number;
  players_online: number;
  play_mode: 'native' | 'cloud';
  engine_key: string;
  stream_url: string;
  cloud_tier: 'standard' | 'premium' | 'ultra';
  status: 'live' | 'queue' | 'maintenance' | 'soon';
  featured: boolean;
  published: boolean;
  sort_order: number;
};

const emptyDraft: Draft = {
  slug: '',
  title: '',
  tagline: '',
  description: '',
  genre: 'Action',
  tags: '',
  publisher: '',
  release_year: '',
  cover_url: '',
  banner_url: '',
  accent: '#6d5cff',
  rating: 4.5,
  players_online: 0,
  play_mode: 'native',
  engine_key: 'neon-snake',
  stream_url: '',
  cloud_tier: 'standard',
  status: 'live',
  featured: false,
  published: true,
  sort_order: 100,
};

function toDraft(g: AdminGameRow): Draft {
  return {
    slug: g.slug,
    title: g.title,
    tagline: g.tagline ?? '',
    description: g.description ?? '',
    genre: g.genre,
    tags: (g.tags ?? []).join(', '),
    publisher: g.publisher ?? '',
    release_year: g.release_year ? String(g.release_year) : '',
    cover_url: g.cover_url ?? '',
    banner_url: g.banner_url ?? '',
    accent: g.accent,
    rating: g.rating,
    players_online: g.players_online,
    play_mode: g.play_mode,
    engine_key: g.engine_key ?? '',
    stream_url: g.stream_url ?? '',
    cloud_tier: g.cloud_tier,
    status: g.status,
    featured: g.featured,
    published: g.published,
    sort_order: g.sort_order,
  };
}

function toPayload(d: Draft) {
  return {
    slug: d.slug.trim(),
    title: d.title.trim(),
    tagline: d.tagline.trim() || null,
    description: d.description.trim() || null,
    genre: d.genre.trim() || 'Action',
    tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
    publisher: d.publisher.trim() || null,
    release_year: d.release_year ? Number(d.release_year) : null,
    cover_url: d.cover_url.trim(),
    banner_url: d.banner_url.trim(),
    accent: d.accent,
    rating: Number(d.rating),
    players_online: Number(d.players_online),
    play_mode: d.play_mode,
    engine_key: d.play_mode === 'native' ? d.engine_key || null : null,
    stream_url: d.play_mode === 'cloud' ? d.stream_url.trim() : '',
    cloud_tier: d.cloud_tier,
    status: d.status,
    featured: d.featured,
    published: d.published,
    sort_order: Number(d.sort_order),
  };
}

export function GamesPanel() {
  const { push } = useToast();
  const [games, setGames] = useState<AdminGameRow[] | null>(null);
  const [q, setQ] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'native' | 'cloud'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminGameRow['status']>('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminGameRow | null }>({ open: false, editing: null });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminGameRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ games: AdminGameRow[] }>('/api/admin/games', { query: { q } });
      setGames(data.games);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load games', 'error');
    } finally {
      setLoading(false);
    }
  }, [q, push]);

  useEffect(() => {
    const id = setTimeout(load, q ? 320 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  const filtered = useMemo(() => {
    const list = games ?? [];
    return list
      .filter((g) => (modeFilter === 'all' ? true : g.play_mode === modeFilter))
      .filter((g) => (statusFilter === 'all' ? true : g.status === statusFilter))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [games, modeFilter, statusFilter]);

  function openNew() {
    setDraft(emptyDraft);
    setModal({ open: true, editing: null });
  }
  function openEdit(g: AdminGameRow) {
    setDraft(toDraft(g));
    setModal({ open: true, editing: g });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = toPayload(draft);
    try {
      if (modal.editing) {
        await adminApi(`/api/admin/games/${modal.editing.id}`, { method: 'PATCH', body: payload });
        push(`Saved ${payload.title}`, 'success');
      } else {
        await adminApi('/api/admin/games', { method: 'POST', body: payload });
        push(`Created ${payload.title}`, 'success');
      }
      setModal({ open: false, editing: null });
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function quickPatch(g: AdminGameRow, patch: Partial<AdminGameRow>, message: string) {
    setBusyId(g.id);
    try {
      await adminApi(`/api/admin/games/${g.id}`, { method: 'PATCH', body: patch });
      setGames((prev) => (prev ?? []).map((x) => (x.id === g.id ? { ...x, ...patch } : x)));
      push(message, 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    const target = confirmDelete;
    if (!target) return;
    setBusyId(target.id);
    try {
      await adminApi(`/api/admin/games/${target.id}`, { method: 'DELETE' });
      setGames((prev) => (prev ?? []).filter((x) => x.id !== target.id));
      push(`Deleted ${target.title}`, 'info');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setConfirmDelete(null);
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input !pl-10 !py-2.5 !text-[13px]" placeholder="Search title…" />
        </div>
        <Segmented
          value={modeFilter}
          onChange={(v) => setModeFilter(v as typeof modeFilter)}
          options={[
            { id: 'all', label: 'All modes' },
            { id: 'native', label: 'Native' },
            { id: 'cloud', label: 'Cloud' },
          ]}
        />
        <Segmented
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          options={[
            { id: 'all', label: 'Any status' },
            { id: 'live', label: 'Live' },
            { id: 'queue', label: 'Queue' },
            { id: 'maintenance', label: 'Maint.' },
            { id: 'soon', label: 'Soon' },
          ]}
        />
        <button onClick={openNew} className="btn-primary !py-2.5 !text-[13px]">
          <IconPlus width={15} height={15} /> New game
        </button>
      </div>

      <p className="text-[11.5px] text-[color:var(--text-faint)]">
        {loading ? 'Loading catalogue…' : `${filtered.length} of ${games?.length ?? 0} titles shown`} · inline switches save instantly
      </p>

      {loading && !games ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.022] px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <IconGamepad width={22} height={22} className="text-[color:var(--text-faint)]" />
          </span>
          <h3 className="text-[16px] font-semibold text-white">No games match those filters</h3>
          <p className="mt-1.5 text-[13px] text-[color:var(--text-dim)]">Clear the search or add a new title to the catalogue.</p>
          <button onClick={openNew} className="btn-primary mt-5">
            <IconPlus width={15} height={15} /> New game
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {filtered.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28 }}
                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.022] p-3.5 transition-colors hover:border-white/[0.14]"
              >
                {busyId === g.id && (
                  <span className="absolute right-3.5 top-3.5 z-10">
                    <Spinner size={14} />
                  </span>
                )}
                <div className="flex gap-3.5">
                  <span className="h-[92px] w-[68px] shrink-0 overflow-hidden rounded-xl">
                    <GameArt slug={g.slug} title={g.title} genre={g.genre} accent={g.accent} coverUrl={g.cover_url} rounded={false} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[14px] font-semibold text-white">{g.title}</h3>
                      <Badge tone={g.status === 'live' ? 'mint' : g.status === 'queue' ? 'amber' : g.status === 'maintenance' ? 'cyan' : 'neutral'}>
                        {g.status}
                      </Badge>
                      <Badge tone={g.play_mode === 'native' ? 'brand' : 'cyan'}>{g.play_mode}</Badge>
                      {g.featured && <Badge tone="amber">Featured</Badge>}
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-[color:var(--text-faint)]">
                      /{g.slug} · {g.genre} · sort {g.sort_order}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[color:var(--text-dim)]">{g.tagline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--text-faint)]">
                      <span className="font-mono">{formatNumber(g.players_online)} online</span>
                      <span className="font-mono">★ {g.rating.toFixed(1)}</span>
                      <span className="font-mono">{g.cloud_tier}</span>
                      {g.engine_key && <span className="font-mono text-brand-300">{g.engine_key}</span>}
                      {g.play_mode === 'cloud' && !g.stream_url && <span className="text-[#fcd34d]">no stream endpoint</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-3">
                  <label className="flex items-center gap-2 text-[11.5px] text-[color:var(--text-dim)]">
                    <Switch checked={g.published} onChange={(v) => quickPatch(g, { published: v }, `${g.title} ${v ? 'published' : 'unpublished'}`)} label="Published" />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-[11.5px] text-[color:var(--text-dim)]">
                    <Switch checked={g.featured} onChange={(v) => quickPatch(g, { featured: v }, `${g.title} ${v ? 'featured' : 'unfeatured'}`)} label="Featured" />
                    Featured
                  </label>
                  <select
                    value={g.status}
                    onChange={(e) => quickPatch(g, { status: e.target.value as AdminGameRow['status'] }, `${g.title} → ${e.target.value}`)}
                    className="rounded-lg border border-white/[0.09] bg-white/[0.03] px-2 py-1.5 text-[11.5px] text-white/80 outline-none focus:border-brand-400/60"
                  >
                    <option value="live">live</option>
                    <option value="queue">queue</option>
                    <option value="maintenance">maintenance</option>
                    <option value="soon">soon</option>
                  </select>
                  <div className="ml-auto flex gap-1.5">
                    <a href={`/games/${g.slug}`} target="_blank" rel="noreferrer" className={cn('btn-ghost !px-2.5 !py-1.5')} title="Open public page">
                      <IconExternal width={14} height={14} />
                    </a>
                    <a href={`/play/${g.slug}`} target="_blank" rel="noreferrer" className={cn('btn-ghost !px-2.5 !py-1.5')} title="Launch">
                      <IconGamepad width={14} height={14} />
                    </a>
                    <button onClick={() => openEdit(g)} className="btn-ghost !px-2.5 !py-1.5" title="Edit">
                      <IconEdit width={14} height={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(g)} className="btn-ghost !px-2.5 !py-1.5 hover:!border-[rgba(251,113,133,0.4)] hover:!text-[#fda4af]" title="Delete">
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? `Edit ${modal.editing.title}` : 'New game'}
        description={modal.editing ? `/${modal.editing.slug}` : 'Adds a title to the public catalogue immediately when published.'}
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setModal({ open: false, editing: null })} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" form="game-form" disabled={saving} className="btn-primary">
              {saving && <Spinner size={15} />}
              {modal.editing ? 'Save changes' : 'Create game'}
            </button>
          </>
        }
      >
        <form id="game-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-1">
            <input required maxLength={120} className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Slug">
            <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className="input font-mono" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} />
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <input maxLength={200} className="input" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={3} maxLength={4000} className="input resize-none" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <Field label="Genre">
            <input required maxLength={40} className="input" value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} />
          </Field>
          <Field label="Tags (comma separated)">
            <input className="input" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="open-world, driving, multiplayer" />
          </Field>
          <Field label="Publisher">
            <input maxLength={120} className="input" value={draft.publisher} onChange={(e) => setDraft({ ...draft, publisher: e.target.value })} />
          </Field>
          <Field label="Release year">
            <input type="number" min={1970} max={2100} className="input font-mono" value={draft.release_year} onChange={(e) => setDraft({ ...draft, release_year: e.target.value })} />
          </Field>
          <Field label="Play mode">
            <select className="input" value={draft.play_mode} onChange={(e) => setDraft({ ...draft, play_mode: e.target.value as 'native' | 'cloud' })}>
              <option value="native">native — runs in the browser</option>
              <option value="cloud">cloud — streamed from GPU pool</option>
            </select>
          </Field>
          {draft.play_mode === 'native' ? (
            <Field label="Engine key">
              <select className="input font-mono" value={draft.engine_key} onChange={(e) => setDraft({ ...draft, engine_key: e.target.value })}>
                {ENGINES.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Stream endpoint (licensed)">
              <input type="url" maxLength={600} className="input font-mono" value={draft.stream_url} onChange={(e) => setDraft({ ...draft, stream_url: e.target.value })} placeholder="https://…" />
            </Field>
          )}
          <Field label="Cloud tier">
            <select className="input" value={draft.cloud_tier} onChange={(e) => setDraft({ ...draft, cloud_tier: e.target.value as Draft['cloud_tier'] })}>
              <option value="standard">standard</option>
              <option value="premium">premium</option>
              <option value="ultra">ultra</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })}>
              <option value="live">live</option>
              <option value="queue">queue</option>
              <option value="maintenance">maintenance</option>
              <option value="soon">soon</option>
            </select>
          </Field>
          <Field label="Accent colour">
            <div className="flex gap-2">
              <input type="color" className="h-[42px] w-[54px] cursor-pointer rounded-lg border border-white/[0.09] bg-transparent p-1" value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} />
              <input pattern="#[0-9a-fA-F]{6}" className="input flex-1 font-mono" value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} />
            </div>
          </Field>
          <Field label="Rating (0–5)">
            <input type="number" step="0.1" min={0} max={5} className="input font-mono" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} />
          </Field>
          <Field label="Players online (display)">
            <input type="number" min={0} className="input font-mono" value={draft.players_online} onChange={(e) => setDraft({ ...draft, players_online: Number(e.target.value) })} />
          </Field>
          <Field label="Sort order">
            <input type="number" min={-1000} max={100000} className="input font-mono" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </Field>
          <Field label="Cover image URL" className="sm:col-span-2">
            <input type="url" maxLength={600} className="input font-mono" value={draft.cover_url} onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })} placeholder="Leave empty to use procedural art" />
          </Field>
          <Field label="Banner image URL" className="sm:col-span-2">
            <input type="url" maxLength={600} className="input font-mono" value={draft.banner_url} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <label className="flex items-center gap-2.5 text-[12.5px] text-[color:var(--text-dim)]">
              <Switch checked={draft.published} onChange={(v) => setDraft({ ...draft, published: v })} label="Published" /> Published
            </label>
            <label className="flex items-center gap-2.5 text-[12.5px] text-[color:var(--text-dim)]">
              <Switch checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} label="Featured" /> Featured on homepage
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        title={`Delete ${confirmDelete?.title ?? 'this game'}?`}
        message="This removes the catalogue row permanently. Scores and sessions referencing it are also removed by the database."
        confirmLabel="Delete game"
      />
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div className="no-scrollbar flex gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
            value === o.id ? 'bg-white/[0.09] text-white' : 'text-[color:var(--text-faint)] hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
