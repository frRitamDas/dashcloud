'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'playing' | 'over' | 'won';
interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  from?: { row: number; col: number };
  merged?: boolean;
  fresh?: boolean;
}

const N = 4;
let tileId = 1;

function emptyBoard(): (Tile | null)[][] {
  return Array.from({ length: N }, () => Array.from({ length: N }, () => null));
}

function addRandom(board: (Tile | null)[][]) {
  const free: { r: number; c: number }[] = [];
  board.forEach((row, r) => row.forEach((cell, c) => !cell && free.push({ r, c })));
  if (!free.length) return board;
  const spot = free[Math.floor(Math.random() * free.length)];
  board[spot.r][spot.c] = {
    id: tileId++,
    value: Math.random() < 0.9 ? 2 : 4,
    row: spot.r,
    col: spot.c,
    fresh: true,
  };
  return board;
}

function canMove(board: (Tile | null)[][]) {
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (!board[r][c]) return true;
      const v = board[r][c]!.value;
      if (r + 1 < N && board[r + 1][c]?.value === v) return true;
      if (c + 1 < N && board[r][c + 1]?.value === v) return true;
    }
  return false;
}

const tileColors: Record<number, { bg: string; fg: string; glow?: string }> = {
  2: { bg: 'rgba(255,255,255,0.075)', fg: '#e8ecf6' },
  4: { bg: 'rgba(255,255,255,0.12)', fg: '#eef1f8' },
  8: { bg: 'rgba(34,211,238,0.28)', fg: '#d9fbff' },
  16: { bg: 'rgba(34,211,238,0.45)', fg: '#05202a' },
  32: { bg: 'rgba(109,92,255,0.42)', fg: '#eef0ff' },
  64: { bg: 'rgba(109,92,255,0.62)', fg: '#ffffff' },
  128: { bg: 'rgba(167,139,250,0.7)', fg: '#150b33' },
  256: { bg: 'rgba(251,191,36,0.6)', fg: '#2a1c02' },
  512: { bg: 'rgba(251,191,36,0.78)', fg: '#2a1c02' },
  1024: { bg: 'rgba(244,63,94,0.72)', fg: '#fff1f3' },
  2048: { bg: 'rgba(74,222,128,0.82)', fg: '#04220f', glow: '0 0 34px rgba(74,222,128,0.55)' },
  4096: { bg: 'linear-gradient(135deg,#6d5cff,#22d3ee)', fg: '#ffffff', glow: '0 0 40px rgba(109,92,255,0.6)' },
};

export default function Dash2048({ onScore, paused, accent, muted }: EngineProps) {
  const [board, setBoard] = useState<(Tile | null)[][]>(() => addRandom(addRandom(emptyBoard())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const busy = useRef(false);

  const reset = useCallback(() => {
    tileId = 1;
    setBoard(addRandom(addRandom(emptyBoard())));
    setScore(0);
    setMoves(0);
    setPhase('playing');
  }, []);

  const move = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (paused || busy.current) return;
      if (phase !== 'playing') return;
      busy.current = true;
      setTimeout(() => (busy.current = false), 110);

      setBoard((prev) => {
        const next = emptyBoard();
        let gained = 0;
        let moved = false;

        const vectors = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
        const rows = [...Array(N).keys()];
        const cols = [...Array(N).keys()];
        if (vectors[0] === 1) rows.reverse();
        if (vectors[1] === 1) cols.reverse();

        const mergedIds = new Set<number>();

        for (const r of rows) {
          for (const c of cols) {
            const tile = prev[r][c];
            if (!tile) continue;
            let nr = r;
            let nc = c;
            while (true) {
              const tr = nr + vectors[0];
              const tc = nc + vectors[1];
              if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
              if (!next[tr][tc]) {
                nr = tr;
                nc = tc;
                continue;
              }
              const other = next[tr][tc]!;
              if (other.value === tile.value && !mergedIds.has(other.id) && !mergedIds.has(tile.id)) {
                nr = tr;
                nc = tc;
              }
              break;
            }
            if (nr !== r || nc !== c) moved = true;
            const target = next[nr][nc];
            if (target && target.value === tile.value) {
              const value = tile.value * 2;
              gained += value;
              mergedIds.add(tile.id);
              next[nr][nc] = { id: tileId++, value, row: nr, col: nc, from: { row: r, col: c }, merged: true };
            } else {
              next[nr][nc] = { ...tile, row: nr, col: nc, from: nr === r && nc === c ? undefined : { row: r, col: c }, merged: false, fresh: false };
            }
          }
        }

        if (!moved) return prev;

        setMoves((m) => m + 1);
        if (gained > 0) {
          setScore((sc) => {
            const total = sc + gained;
            setBest((b) => Math.max(b, total));
            return total;
          });
          if (!muted) sfx.place();
        } else if (!muted) {
          sfx.click();
        }

        addRandom(next);
        const flat = next.flat().filter(Boolean) as Tile[];
        if (flat.some((t) => t.value >= 2048) && phase === 'playing') {
          onScore(flat.reduce((a, t) => Math.max(a, t.value), 0), 'tile', { score: score + gained });
          setPhase('won');
          if (!muted) sfx.win();
        } else if (!canMove(next)) {
          onScore(score + gained, 'points', { moves: moves + 1 });
          setPhase('over');
          if (!muted) sfx.lose();
        }
        return next;
      });
    },
    [muted, moves, onScore, paused, phase, score],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        arrowup: 'up',
        w: 'up',
        arrowdown: 'down',
        s: 'down',
        arrowleft: 'left',
        a: 'left',
        arrowright: 'right',
        d: 'right',
      };
      if (map[k]) {
        e.preventDefault();
        if (phase === 'idle' || phase === 'over') reset();
        else move(map[k]);
      }
      if ((k === 'enter' || k === ' ') && phase !== 'playing') {
        e.preventDefault();
        reset();
      }
    }
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [move, phase, reset]);

  // swipe
  const touch = useRef({ x: 0, y: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
    if (phase !== 'playing') reset();
    else if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  };

  const tiles = board.flat().filter(Boolean) as Tile[];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#07080f] p-3">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${accent}22, transparent)` }}
      />

      <div className="relative w-full max-w-[460px]">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="flex gap-2">
            <EngineStat label="Score" value={score.toLocaleString()} accent={accent} />
            <EngineStat label="Best" value={best.toLocaleString()} />
          </div>
          <div className="flex gap-2">
            <EngineStat label="Moves" value={String(moves)} />
            <EngineStat label="Top" value={String(tiles.reduce((a, t) => Math.max(a, t.value), 0))} accent="#fbbf24" />
          </div>
        </div>

        <div
          className="relative aspect-square w-full touch-none rounded-2xl border border-white/[0.08] bg-white/[0.035] p-[3%] backdrop-blur"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-[3%] grid grid-cols-4 grid-rows-4 gap-[3%]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/[0.045]" />
            ))}
          </div>

          <div className="absolute inset-[3%]">
            {tiles.map((tile) => {
              const pct = 100 / N;
              const style = tileColors[tile.value] ?? tileColors[4096];
              return (
                <div
                  key={tile.id}
                  className={cn(
                    'absolute flex items-center justify-center rounded-xl font-bold tabular-nums transition-all duration-[110ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                    tile.fresh && 'animate-pop-in',
                    tile.merged && 'animate-pop-merge',
                  )}
                  style={{
                    width: `calc(${pct}% - 2.25%)`,
                    height: `calc(${pct}% - 2.25%)`,
                    left: `calc(${tile.col * pct}% + 1.125%)`,
                    top: `calc(${tile.row * pct}% + 1.125%)`,
                    background: style.bg,
                    color: style.fg,
                    boxShadow: style.glow ?? '0 1px 0 rgba(255,255,255,0.09) inset',
                    fontSize: tile.value >= 1024 ? 'clamp(14px,4.2vw,22px)' : 'clamp(17px,5.4vw,28px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {tile.value}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-center text-[11.5px] text-[color:var(--text-faint)]">Arrow keys / WASD or swipe to slide the board</p>

        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:hidden">
          <div />
          <PadButton label="▲" onPress={() => move('up')} />
          <div />
          <PadButton label="◀" onPress={() => move('left')} />
          <PadButton label="▼" onPress={() => move('down')} />
          <PadButton label="▶" onPress={() => move('right')} />
        </div>
      </div>

      {phase !== 'playing' && (
        <EngineOverlay
          title={phase === 'idle' ? 'Dash 2048' : phase === 'won' ? 'You hit 2048' : 'No moves left'}
          subtitle={
            phase === 'idle'
              ? 'Merge matching tiles to reach 2048. Every merge scores points — keep the board alive as long as you can.'
              : `Final score ${score.toLocaleString()} across ${moves} moves.`
          }
          accent={accent}
          onStart={reset}
          cta={phase === 'idle' ? 'Start game' : 'New board'}
        />
      )}
    </div>
  );
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onClick={onPress}
      className="rounded-xl border border-white/10 bg-white/[0.06] py-3 text-[13px] font-bold text-white/80 active:bg-white/[0.14]"
    >
      {label}
    </button>
  );
}
