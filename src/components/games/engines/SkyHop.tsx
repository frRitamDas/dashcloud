'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameCanvas, useGameLoop } from '@/hooks/useGameCanvas';
import { sfx } from '@/lib/sfx';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

type Phase = 'idle' | 'playing' | 'over';
interface Tower {
  x: number;
  gapY: number;
  gap: number;
  passed: boolean;
}
interface Star {
  x: number;
  y: number;
  r: number;
}
interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function SkyHop({ onScore, onTelemetry, paused, accent, muted }: EngineProps) {
  const { canvasRef, size } = useGameCanvas<HTMLCanvasElement>(2);
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const st = useRef({
    y: 0.5,
    vy: 0,
    towers: [] as Tower[],
    stars: [] as Star[],
    puffs: [] as Puff[],
    scroll: 0,
    score: 0,
    speed: 165,
    spawnIn: 0,
    shake: 0,
    fps: 60,
    fpsAcc: 0,
    fpsCount: 0,
    tilt: 0,
  });

  useEffect(() => {
    st.current.stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.7, r: Math.random() * 1.6 + 0.4 }));
  }, []);

  const start = useCallback(() => {
    const s = st.current;
    s.y = 0.45;
    s.vy = 0;
    s.towers = [];
    s.puffs = [];
    s.score = 0;
    s.speed = 165;
    s.spawnIn = 0.9;
    s.shake = 0;
    setScore(0);
    setPhase('playing');
  }, []);

  const flap = useCallback(() => {
    if (phase !== 'playing') {
      start();
      return;
    }
    st.current.vy = -330;
    st.current.puffs.push({ x: 0.18, y: st.current.y, vx: -60, vy: 40, life: 0.4 });
    if (!muted) sfx.jump();
  }, [phase, start, muted]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ([' ', 'arrowup', 'w', 'enter'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onClick = () => flap();
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      flap();
    };
    el.addEventListener('mousedown', onClick);
    el.addEventListener('touchstart', onTouch, { passive: false });
    return () => {
      el.removeEventListener('mousedown', onClick);
      el.removeEventListener('touchstart', onTouch);
    };
  }, [canvasRef, flap]);

  const running = phase === 'playing' && !paused && size.width > 0;

  useGameLoop((dt) => {
    const s = st.current;
    const w = size.width;
    const h = size.height;

    s.fpsAcc += dt;
    s.fpsCount++;
    if (s.fpsAcc >= 0.5) {
      s.fps = Math.round(s.fpsCount / s.fpsAcc);
      s.fpsAcc = 0;
      s.fpsCount = 0;
      onTelemetry?.({ fps: s.fps, detail: `${s.speed.toFixed(0)} km/h` });
    }

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 18);
    s.scroll += s.speed * dt;
    s.vy += 900 * dt;
    s.y += (s.vy * dt) / h;
    s.tilt = Math.max(-0.5, Math.min(1.1, s.vy / 620));

    s.spawnIn -= dt;
    if (s.spawnIn <= 0) {
      s.spawnIn = 1.55 - Math.min(0.5, s.score * 0.008);
      const gap = Math.max(120, h * 0.3 - s.score * 1.6);
      s.towers.push({ x: w + 80, gapY: h * 0.22 + Math.random() * (h * 0.56 - gap), gap, passed: false });
    }

    s.towers.forEach((t) => {
      t.x -= s.speed * dt;
      if (!t.passed && t.x + 34 < w * 0.18) {
        t.passed = true;
        s.score += 1;
        setScore(s.score);
        s.speed = Math.min(320, s.speed + 3.2);
        if (!muted) sfx.eat();
      }
    });
    s.towers = s.towers.filter((t) => t.x > -120);

    s.puffs = s.puffs.filter((p) => {
      p.life -= dt;
      p.x += (p.vx * dt) / w;
      p.y += (p.vy * dt) / h;
      return p.life > 0;
    });

    // collisions
    const px = w * 0.18;
    const py = s.y * h;
    const r = 13;
    if (py - r < 0 || py + r > h - 6) return crash();
    for (const t of s.towers) {
      if (px + r > t.x && px - r < t.x + 66) {
        if (py - r < t.gapY || py + r > t.gapY + t.gap) return crash();
      }
    }

    function crash() {
      s.shake = 10;
      if (!muted) sfx.explode();
      setPhase('over');
      setBest((b) => Math.max(b, s.score));
      onScore(s.score, 'towers');
    }
  }, running);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = st.current;
    const w = size.width;
    const h = size.height;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.save();
      if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0b1030');
      sky.addColorStop(0.55, '#1b1140');
      sky.addColorStop(1, '#05060a');
      ctx.fillStyle = sky;
      ctx.fillRect(-14, -14, w + 28, h + 28);

      // stars
      s.stars.forEach((star) => {
        const x = ((star.x * w - s.scroll * 0.06) % (w + 20) + w + 20) % (w + 20);
        ctx.globalAlpha = 0.35 + star.r * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // moon
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 60;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.2, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // far skyline
      ctx.fillStyle = 'rgba(9,11,26,0.92)';
      const farOffset = (s.scroll * 0.14) % 160;
      for (let x = -160; x < w + 160; x += 80) {
        const bh = 40 + ((Math.abs(Math.sin((x + farOffset) * 0.013)) * 90) | 0);
        ctx.fillRect(x - farOffset, h - bh - 30, 62, bh + 40);
      }

      // near skyline
      ctx.fillStyle = 'rgba(4,5,12,0.98)';
      const nearOffset = (s.scroll * 0.3) % 130;
      for (let x = -130; x < w + 130; x += 65) {
        const bh = 30 + ((Math.abs(Math.cos((x + nearOffset) * 0.017)) * 70) | 0);
        ctx.fillRect(x - nearOffset, h - bh, 48, bh + 10);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let wy = h - bh + 8; wy < h - 6; wy += 12) ctx.fillRect(x - nearOffset + 6, wy, 5, 4);
        ctx.fillStyle = 'rgba(4,5,12,0.98)';
      }

      // towers
      s.towers.forEach((t) => {
        const grad = ctx.createLinearGradient(t.x, 0, t.x + 66, 0);
        grad.addColorStop(0, 'rgba(30,36,60,0.96)');
        grad.addColorStop(0.5, 'rgba(18,22,40,0.98)');
        grad.addColorStop(1, 'rgba(30,36,60,0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(t.x, -10, 66, t.gapY + 10);
        ctx.fillRect(t.x, t.gapY + t.gap, 66, h - t.gapY - t.gap + 10);

        ctx.strokeStyle = `${accent}88`;
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x + 1, t.gapY - 26, 64, 26);
        ctx.strokeRect(t.x + 1, t.gapY + t.gap, 64, 26);

        ctx.fillStyle = `${accent}22`;
        ctx.fillRect(t.x, t.gapY - 26, 66, 26);
        ctx.fillRect(t.x, t.gapY + t.gap, 66, 26);
      });

      // puffs
      s.puffs.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 4 * p.life * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ship
      const px = w * 0.18;
      const py = s.y * h;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(s.tilt * 0.5);
      ctx.shadowColor = accent;
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f4f6fb';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(22, 0);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(2, -18);
      ctx.lineTo(6, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0b1020';
      ctx.beginPath();
      ctx.arc(6, -2, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, size, accent]);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <EngineStat label="Towers" value={score.toLocaleString()} accent={accent} />
        <EngineStat label="Best" value={best.toLocaleString()} />
      </div>
      {phase !== 'playing' && (
        <EngineOverlay
          title={phase === 'over' ? 'Crashed' : 'Sky Hop'}
          subtitle={phase === 'over' ? `You cleared ${score} tower${score === 1 ? '' : 's'}.` : 'Click, tap or press Space to flap. Thread the gaps between the towers.'}
          accent={accent}
          onStart={flap}
          cta={phase === 'over' ? 'Fly again' : 'Take off'}
        />
      )}
    </div>
  );
}
