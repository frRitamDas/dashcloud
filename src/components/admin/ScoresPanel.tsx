'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import type { ScoreRowAdmin } from './types';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { IconRefresh, IconTrash, IconTrophy } from '@/components/ui/Icons';
import { timeAgo } from '@/lib/utils';

export function ScoresPanel({ games }: { games: { id: string; slug: string; title: string; accent: string }[] }) {
  const { push } = useToast();
  const [scores, setScores] = useState<ScoreRowAdmin[]>([]);
  const [gameId, setGameId] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ScoreRowAdmin | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi<{ scores: ScoreRowAdmin[] }>('/api/admin/scores', { query: { gameId: gameId || undefined, limit: 120 } });
      setScores(data.scores);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not load scores', 'error');
    } finally {
      setLoading(false);
    }
  }, [gameId, push]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    try {
      await adminApi('/api/admin/scores', { method: 'DELETE', body: { id: confirm.id } });
      setScores((prev) => prev.filter((s) => s.id !== confirm.id));
      push('Score removed from the leaderboard', 'info');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} className="input !w-auto !py-2.5 !text-[13px]">
          <option value="">All games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
        <button onClick={load} className="btn-ghost !py-2 !text-[12px]">
          <IconRefresh width={14} height={14} /> Refresh
        </button>
        <span className="ml-auto text-[12px] text-[color:var(--text-faint)]">{scores.length} rows shown · highest first</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.022]">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_auto] gap-3 border-b border-white/[0.07] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)] lg:grid">
          <span>Game</span>
          <span>Player</span>
          <span className="text-right">Score</span>
          <span>Metric</span>
          <span>Submitted</span>
          <span />
        </div>

        {loading && scores.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-[12.5px] text-[color:var(--text-faint)]">
            <Spinner size={15} /> Loading scores…
          </div>
        ) : scores.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <IconTrophy width={22} height={22} className="text-[color:var(--text-faint)]" />
            </span>
            <h3 className="text-[16px] font-semibold text-white">No scores yet</h3>
            <p className="mt-1.5 text-[13px] text-[color:var(--text-dim)]">Runs submitted from the play page appear here instantly.</p>
          </div>
        ) : (
          scores.map((s) => (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.045] px-5 py-3 last:border-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_120px_120px_auto]">
              <span className="truncate text-[13px] font-semibold text-white">{s.games?.title ?? 'Unknown'}</span>
              <span className="truncate text-[12px] text-[color:var(--text-dim)]">
                {s.profiles?.display_name || s.profiles?.username || s.guest_name || 'Anonymous'}
                {s.profiles?.level ? <span className="ml-1.5 font-mono text-[10.5px] text-[color:var(--text-faint)]">Lv {s.profiles.level}</span> : null}
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums" style={{ color: s.games?.accent ?? '#fff' }}>
                {s.score.toLocaleString()}
              </span>
              <span className="hidden font-mono text-[11.5px] capitalize text-[color:var(--text-faint)] lg:block">{s.metric}</span>
              <span className="hidden text-[11.5px] text-[color:var(--text-faint)] lg:block">{timeAgo(s.created_at)}</span>
              <span className="flex justify-end">
                <button onClick={() => setConfirm(s)} className="btn-ghost !px-2.5 !py-1.5 hover:!border-[rgba(251,113,133,0.4)] hover:!text-[#fda4af]" title="Delete score">
                  <IconTrash width={14} height={14} />
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete this score?"
        message={`Removes ${confirm?.score.toLocaleString() ?? ''} ${confirm?.metric ?? ''} for ${confirm?.profiles?.display_name || confirm?.guest_name || 'this player'} from the leaderboard.`}
        confirmLabel={busy ? 'Deleting…' : 'Delete score'}
      />
    </div>
  );
}
