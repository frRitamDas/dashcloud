'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameCanvas, useGameLoop } from '@/hooks/useGameCanvas';
import { sfx } from '@/lib/sfx';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

type Phase = 'idle' | 'playing' | 'over' | 'cleared';
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}
interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  hue: number;
  alive: boolean;
}
interface Drop {
  x: number;
  y: number;
  vy: number;
  kind: 'multi' | 'wide' | 'slow' | 'life';
}
interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

const COLS = 11;
const ROWS = 6;

export default function BrickNova({ onScore, onTelemetry, paused, accent, muted }: EngineProps) {
  const { canvasRef, size } = useGameCanvas<HTMLCanvasElement>(2);
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const s = useRef({
    paddleX: 0.5,
    paddleW: 110,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    drops: [] as Drop[],
    shards: [] as Shard[],
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    wideT: 0,
    slowT: 0,
    stuck: true,
    fps: 60,
    fpsAcc: 0,
    fpsCount: 0,
    shake: 0,
  });

  const buildLevel = useCallback((lvl: number, w: number, h: number) => {
    const st = s.current;
    const padX = w * 0.08;
    const topY = h * 0.14;
    const bw = (w - padX * 2) / COLS;
    const bh = Math.min(26, h * 0.045);
    st.bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const pattern = (r + c + lvl) % 5;
        if (pattern === 4 && lvl % 2 === 0) continue;
        const hp = 1 + ((r + lvl) % 3 === 0 ? 1 : 0) + (lvl > 2 && r === 0 ? 1 : 0);
        st.bricks.push({
          x: padX + c * bw + 2,
          y: topY + r * (bh + 6),
          w: bw - 4,
          h: bh,
          hp,
          maxHp: hp,
          hue: (r * 26 + lvl * 12) % 360,
          alive: true,
        });
      }
    }
    st.balls = [{ x: w / 2, y: h - 70, vx: 0, vy: 0, r: 7 }];
    st.drops = [];
    st.stuck = true;
    st.paddleW = 110;
  }, []);

  const start = useCallback(() => {
    const st = s.current;
    st.score = 0;
    st.lives = 3;
    st.level = 1;
    st.combo = 0;
    st.wideT = 0;
    st.slowT = 0;
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    buildLevel(1, size.width, size.height);
    setPhase('playing');
  }, [buildLevel, size.width, size.height]);

  useEffect(() => {
    if (phase === 'playing' && s.current.bricks.length === 0) buildLevel(s.current.level, size.width, size.height);
  }, [phase, size.width, size.height, buildLevel]);

  const launch = useCallback(() => {
    const st = s.current;
    if (!st.stuck) return;
    st.stuck = false;
    const speed = 380 + st.level * 18;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    st.balls.forEach((b) => {
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
    });
    if (!muted) sfx.click();
  }, [muted]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (phase !== 'playing') {
        if (k === 'enter' || k === ' ') start();
        return;
      }
      if (k === ' ') launch();
    }
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, launch]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const move = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      s.current.paddleX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    };
    const mouse = (e: MouseEvent) => move(e.clientX);
    const touch = (e: TouchEvent) => {
      move(e.touches[0].clientX);
      if (s.current.stuck) launch();
    };
    const click = () => launch();
    el.addEventListener('mousemove', mouse);
    el.addEventListener('touchmove', touch, { passive: true });
    el.addEventListener('touchstart', touch, { passive: true });
    el.addEventListener('click', click);
    return () => {
      el.removeEventListener('mousemove', mouse);
      el.removeEventListener('touchmove', touch);
      el.removeEventListener('touchstart', touch);
      el.removeEventListener('click', click);
    };
  }, [canvasRef, launch]);

  const running = phase === 'playing' && !paused && size.width > 0;

  useGameLoop((dt) => {
    const st = s.current;
    const w = size.width;
    const h = size.height;

    st.fpsAcc += dt;
    st.fpsCount++;
    if (st.fpsAcc >= 0.5) {
      st.fps = Math.round(st.fpsCount / st.fpsAcc);
      st.fpsAcc = 0;
      st.fpsCount = 0;
      onTelemetry?.({ fps: st.fps, detail: `balls ${st.balls.length} · bricks ${st.bricks.filter((b) => b.alive).length}` });
    }

    if (st.wideT > 0) {
      st.wideT -= dt;
      if (st.wideT <= 0) st.paddleW = 110;
    }
    if (st.slowT > 0) st.slowT -= dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 22);

    const paddleW = st.paddleW * (st.wideT > 0 ? 1.45 : 1);
    const paddleY = h - 42;
    const px = st.paddleX * w - paddleW / 2;

    if (st.stuck) {
      st.balls.forEach((b) => {
        b.x = px + paddleW / 2;
        b.y = paddleY - 12;
      });
    }

    const slowFactor = st.slowT > 0 ? 0.62 : 1;

    st.balls.forEach((b) => {
      if (st.stuck) return;
      b.x += b.vx * dt * slowFactor;
      b.y += b.vy * dt * slowFactor;

      if (b.x < b.r) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
      }
      if (b.x > w - b.r) {
        b.x = w - b.r;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < b.r + 8) {
        b.y = b.r + 8;
        b.vy = Math.abs(b.vy);
      }

      // paddle
      if (b.vy > 0 && b.y + b.r >= paddleY && b.y + b.r <= paddleY + 18 && b.x >= px - 6 && b.x <= px + paddleW + 6) {
        const rel = (b.x - (px + paddleW / 2)) / (paddleW / 2);
        const speed = Math.hypot(b.vx, b.vy);
        const angle = -Math.PI / 2 + rel * 1.05;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        b.y = paddleY - b.r - 1;
        st.combo = 0;
        setCombo(0);
        if (!muted) sfx.click();
      }

      // bricks
      for (const brick of st.bricks) {
        if (!brick.alive) continue;
        if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w && b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
          const overlapX = Math.min(b.x + b.r - brick.x, brick.x + brick.w - (b.x - b.r));
          const overlapY = Math.min(b.y + b.r - brick.y, brick.y + brick.h - (b.y - b.r));
          if (overlapX < overlapY) b.vx = -b.vx;
          else b.vy = -b.vy;

          brick.hp -= 1;
          st.combo += 1;
          setCombo(st.combo);
          const gain = 12 * Math.max(1, Math.floor(st.combo / 3));
          st.score += gain;
          setScore(st.score);
          if (!muted) sfx.hit();

          for (let i = 0; i < 8; i++) {
            st.shards.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 260,
              vy: (Math.random() - 0.5) * 260,
              life: 0.4 + Math.random() * 0.3,
              size: 2 + Math.random() * 3,
              hue: brick.hue,
            });
          }

          if (brick.hp <= 0) {
            brick.alive = false;
            st.score += 25;
            setScore(st.score);
            st.shake = 3;
            if (Math.random() < 0.14) {
              const kinds: Drop['kind'][] = ['multi', 'wide', 'slow', 'life'];
              st.drops.push({ x: brick.x + brick.w / 2, y: brick.y, vy: 120, kind: kinds[Math.floor(Math.random() * kinds.length)] });
            }
          }
          break;
        }
      }
    });

    // lost balls
    st.balls = st.balls.filter((b) => b.y - b.r < h + 30);
    if (st.balls.length === 0) {
      st.lives -= 1;
      st.combo = 0;
      setLives(st.lives);
      setCombo(0);
      st.shake = 8;
      if (!muted) sfx.explode();
      if (st.lives <= 0) {
        setPhase('over');
        onScore(st.score, 'points', { level: st.level });
        if (!muted) sfx.lose();
        return;
      }
      st.balls = [{ x: w / 2, y: h - 70, vx: 0, vy: 0, r: 7 }];
      st.stuck = true;
    }

    // drops
    st.drops = st.drops.filter((d) => {
      d.y += d.vy * dt;
      if (d.y > paddleY - 10 && d.y < paddleY + 22 && d.x > px && d.x < px + paddleW) {
        if (d.kind === 'multi') {
          const base = st.balls[0];
          if (base) {
            for (let i = 0; i < 2; i++) {
              const a = Math.atan2(base.vy || -1, base.vx || 0.4) + (i === 0 ? 0.5 : -0.5);
              const sp = Math.hypot(base.vx, base.vy) || 380;
              st.balls.push({ x: base.x, y: base.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7 });
            }
          }
        } else if (d.kind === 'wide') {
          st.wideT = 12;
        } else if (d.kind === 'slow') {
          st.slowT = 8;
        } else {
          st.lives += 1;
          setLives(st.lives);
        }
        st.score += 40;
        setScore(st.score);
        if (!muted) sfx.eat();
        return false;
      }
      return d.y < h + 20;
    });

    st.shards = st.shards.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      return p.life > 0;
    });

    // level clear
    if (st.bricks.length && st.bricks.every((b) => !b.alive)) {
      st.level += 1;
      st.score += 250;
      setLevel(st.level);
      setScore(st.score);
      if (!muted) sfx.win();
      buildLevel(st.level, w, h);
    }
  }, running);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = s.current;
    const w = size.width;
    const h = size.height;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.save();
      if (st.shake > 0) ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0a0817');
      bg.addColorStop(1, '#05060a');
      ctx.fillStyle = bg;
      ctx.fillRect(-10, -10, w + 20, h + 20);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * h) / 12);
        ctx.lineTo(w, (i * h) / 12);
        ctx.stroke();
      }

      // bricks
      for (const b of st.bricks) {
        if (!b.alive) continue;
        const alpha = 0.35 + (b.hp / b.maxHp) * 0.65;
        ctx.save();
        ctx.shadowColor = `hsla(${b.hue},90%,60%,0.6)`;
        ctx.shadowBlur = 12;
        ctx.fillStyle = `hsla(${b.hue},85%,${42 + (b.hp / b.maxHp) * 22}%,${alpha})`;
        roundRect(ctx, b.x, b.y, b.w, b.h, 5);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = `hsla(${b.hue},95%,78%,0.4)`;
        ctx.lineWidth = 1;
        roundRect(ctx, b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, 5);
        ctx.stroke();
        if (b.maxHp > 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(b.hp), b.x + b.w / 2, b.y + b.h / 2 + 3.5);
        }
      }

      // paddle
      const paddleW = st.paddleW * (st.wideT > 0 ? 1.45 : 1);
      const px = st.paddleX * w - paddleW / 2;
      const py = h - 42;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 20;
      const grad = ctx.createLinearGradient(px, py, px + paddleW, py);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      roundRect(ctx, px, py, paddleW, 13, 7);
      ctx.fill();
      ctx.restore();

      // balls
      st.balls.forEach((b) => {
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = `${accent}66`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // drops
      st.drops.forEach((d) => {
        const color = d.kind === 'life' ? '#fb7185' : d.kind === 'multi' ? '#22d3ee' : d.kind === 'wide' ? '#fbbf24' : '#a78bfa';
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = color;
        roundRect(ctx, d.x - 13, d.y - 8, 26, 16, 5);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.kind === 'life' ? 'HP' : d.kind === 'multi' ? 'x3' : d.kind === 'wide' ? 'W' : 'S', d.x, d.y + 3);
      });

      // shards
      st.shards.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = `hsl(${p.hue},90%,65%)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      if (st.stuck && phase === 'playing') {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '600 12px ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Click or press Space to launch', w / 2, h - 76);
      }

      ctx.restore();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, size, accent, phase]);

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
      <canvas ref={canvasRef} className="h-full w-full cursor-none" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          <EngineStat label="Score" value={score.toLocaleString()} accent={accent} />
          <EngineStat label="Level" value={String(level)} />
          {combo > 2 && <EngineStat label="Combo" value={`×${combo}`} accent="#fbbf24" />}
        </div>
        <div className="flex flex-col items-end gap-2">
          <EngineStat label="Lives" value={'♥'.repeat(Math.max(0, lives)) || '—'} accent="#fb7185" />
          {(s.current.wideT > 0 || s.current.slowT > 0) && (
            <EngineStat label="Power" value={s.current.wideT > 0 ? 'WIDE' : 'SLOW'} accent="#a78bfa" />
          )}
        </div>
      </div>
      {phase !== 'playing' && (
        <EngineOverlay
          title={phase === 'over' ? 'Board cleared you' : 'Brick Nova'}
          subtitle={
            phase === 'over'
              ? `Final score ${score.toLocaleString()} on level ${level}. Catch power-ups and chain combos for multipliers.`
              : 'Move with the mouse or your finger. Click / Space launches. Break every brick to advance.'
          }
          accent={accent}
          onStart={start}
          cta={phase === 'over' ? 'Play again' : 'Start game'}
        />
      )}
    </div>
  );
}
