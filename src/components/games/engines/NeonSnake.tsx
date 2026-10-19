'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameCanvas, useGameLoop } from '@/hooks/useGameCanvas';
import { sfx } from '@/lib/sfx';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

const GRID = 22;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: string;
}

type Phase = 'idle' | 'playing' | 'over';

export default function NeonSnake({ onScore, onTelemetry, paused, accent, muted }: EngineProps) {
  const { canvasRef, size } = useGameCanvas<HTMLCanvasElement>(2);
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [speed, setSpeed] = useState(1);

  const state = useRef({
    snake: [{ x: 10, y: 11 }] as { x: number; y: number }[],
    dir: { x: 1, y: 0 },
    queue: [] as { x: number; y: number }[],
    food: { x: 15, y: 11 },
    bonus: null as { x: number; y: number; ttl: number } | null,
    acc: 0,
    score: 0,
    step: 0.13,
    particles: [] as Particle[],
    flash: 0,
    fps: 60,
    fpsAcc: 0,
    fpsCount: 0,
  });

  const reset = useCallback(() => {
    const s = state.current;
    s.snake = [
      { x: 10, y: 11 },
      { x: 9, y: 11 },
      { x: 8, y: 11 },
    ];
    s.dir = { x: 1, y: 0 };
    s.queue = [];
    s.score = 0;
    s.step = 0.13;
    s.particles = [];
    s.bonus = null;
    s.food = spawnFood(s.snake);
    setScore(0);
    setSpeed(1);
  }, []);

  function spawnFood(snake: { x: number; y: number }[]) {
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(Math.random() * GRID);
      const y = Math.floor(Math.random() * GRID);
      if (!snake.some((s) => s.x === x && s.y === y)) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  const start = useCallback(() => {
    reset();
    setPhase('playing');
  }, [reset]);

  const turn = useCallback((dx: number, dy: number) => {
    const s = state.current;
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (last.x === dx && last.y === dy) return;
    if (last.x === -dx && last.y === -dy) return;
    if (s.queue.length < 3) s.queue.push({ x: dx, y: dy });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (phase !== 'playing') {
        if (k === 'enter' || k === ' ') start();
        return;
      }
      if (k === 'arrowup' || k === 'w') turn(0, -1);
      else if (k === 'arrowdown' || k === 's') turn(0, 1);
      else if (k === 'arrowleft' || k === 'a') turn(-1, 0);
      else if (k === 'arrowright' || k === 'd') turn(1, 0);
    }
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, turn]);

  // touch swipe
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
        if (phase !== 'playing') start();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
      else turn(0, dy > 0 ? 1 : -1);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [canvasRef, phase, start, turn]);

  const running = phase === 'playing' && !paused && size.width > 0;

  useGameLoop((dt) => {
    const s = state.current;
    s.fpsAcc += dt;
    s.fpsCount += 1;
    if (s.fpsAcc >= 0.5) {
      s.fps = Math.round(s.fpsCount / s.fpsAcc);
      s.fpsAcc = 0;
      s.fpsCount = 0;
      onTelemetry?.({ fps: s.fps, detail: `length ${s.snake.length}` });
    }

    s.acc += dt;
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 3);

    while (s.acc >= s.step) {
      s.acc -= s.step;
      if (s.queue.length) s.dir = s.queue.shift()!;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

      if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        s.flash = 1;
        if (!muted) sfx.lose();
        setPhase('over');
        setBest((b) => Math.max(b, s.score));
        onScore(s.score, 'points', { length: s.snake.length, speed: Number(s.step.toFixed(3)) });
        return;
      }

      s.snake.unshift(head);

      const ate = head.x === s.food.x && head.y === s.food.y;
      const bonusAte = s.bonus && head.x === s.bonus.x && head.y === s.bonus.y;

      if (ate || bonusAte) {
        const gain = bonusAte ? 50 : 10;
        s.score += gain;
        setScore(s.score);
        s.step = Math.max(0.055, s.step * 0.982);
        setSpeed(Number((0.13 / s.step).toFixed(2)));
        if (!muted) sfx.eat();
        for (let i = 0; i < (bonusAte ? 26 : 14); i++) {
          s.particles.push({
            x: head.x,
            y: head.y,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            life: 0.55 + Math.random() * 0.35,
            hue: bonusAte ? '#fbbf24' : accent,
          });
        }
        s.food = spawnFood(s.snake);
        if (bonusAte) s.bonus = null;
        else if (s.score > 0 && s.score % 60 === 0 && !s.bonus) {
          s.bonus = { ...spawnFood(s.snake), ttl: 9 };
        }
      } else {
        s.snake.pop();
      }
    }

    if (s.bonus) {
      s.bonus.ttl -= dt;
      if (s.bonus.ttl <= 0) s.bonus = null;
    }

    s.particles = s.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      return p.life > 0;
    });
  }, running);

  // ---------- render ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = state.current;
    const cell = Math.min(size.width, size.height) / GRID;
    const ox = (size.width - cell * GRID) / 2;
    const oy = (size.height - cell * GRID) / 2;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, size.width, size.height);

      const bg = ctx.createLinearGradient(0, 0, size.width, size.height);
      bg.addColorStop(0, '#070912');
      bg.addColorStop(1, '#04050a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.width, size.height);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(ox + i * cell, oy);
        ctx.lineTo(ox + i * cell, oy + GRID * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox, oy + i * cell);
        ctx.lineTo(ox + GRID * cell, oy + i * cell);
        ctx.stroke();
      }

      // border
      ctx.strokeStyle = `${accent}55`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, GRID * cell, GRID * cell);

      // food
      const pulse = 1 + Math.sin(performance.now() / 220) * 0.12;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(ox + s.food.x * cell + cell / 2, oy + s.food.y * cell + cell / 2, (cell / 2.9) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (s.bonus) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, s.bonus.ttl);
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fbbf24';
        const r = cell / 3;
        const cx = ox + s.bonus.x * cell + cell / 2;
        const cy = oy + s.bonus.y * cell + cell / 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // snake
      s.snake.forEach((seg, i) => {
        const t = 1 - i / Math.max(1, s.snake.length);
        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = i === 0 ? 22 : 10 * t;
        ctx.fillStyle = i === 0 ? '#ffffff' : accent;
        ctx.globalAlpha = 0.35 + t * 0.65;
        const pad = cell * (i === 0 ? 0.08 : 0.14);
        roundRect(ctx, ox + seg.x * cell + pad, oy + seg.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3);
        ctx.fill();
        ctx.restore();
      });

      // particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life * 1.6);
        ctx.fillStyle = p.hue;
        ctx.shadowColor = p.hue;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ox + p.x * cell + cell / 2, oy + p.y * cell + cell / 2, cell * 0.14 * p.life * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (s.flash > 0) {
        ctx.fillStyle = `rgba(251,113,133,${s.flash * 0.22})`;
        ctx.fillRect(0, 0, size.width, size.height);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, size, accent]);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="flex gap-2">
          <EngineStat label="Score" value={score.toLocaleString()} accent={accent} />
          <EngineStat label="Best" value={best.toLocaleString()} />
        </div>
        <EngineStat label="Speed" value={`${speed}×`} />
      </div>

      {phase !== 'playing' && (
        <EngineOverlay
          title={phase === 'over' ? 'Run complete' : 'Neon Serpent'}
          subtitle={phase === 'over' ? `You scored ${score.toLocaleString()} points${score >= best && score > 0 ? ' — new personal best' : ''}.` : 'Arrow keys or WASD to steer. Swipe on touch devices.'}
          accent={accent}
          onStart={start}
          cta={phase === 'over' ? 'Run it back' : 'Start run'}
        />
      )}
    </div>
  );
}
