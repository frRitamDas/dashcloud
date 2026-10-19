'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameCanvas, useGameLoop } from '@/hooks/useGameCanvas';
import { sfx } from '@/lib/sfx';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

type Phase = 'idle' | 'playing' | 'over';
interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  r: number;
  kind: 'drifter' | 'zig' | 'shooter' | 'boss';
  t: number;
  fireIn: number;
  hue: number;
}
interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  foe: boolean;
  hue: number;
}
interface Star {
  x: number;
  y: number;
  z: number;
}
interface Boom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}
interface Power {
  x: number;
  y: number;
  kind: 'spread' | 'rapid' | 'shield' | 'bomb';
}

export default function StarRaider({ onScore, onTelemetry, paused, accent, muted, quality }: EngineProps) {
  const { canvasRef, size } = useGameCanvas<HTMLCanvasElement>(2);
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [power, setPower] = useState<string | null>(null);

  const st = useRef({
    px: 0.5,
    py: 0.82,
    keys: { l: false, r: false, u: false, d: false },
    bullets: [] as Bullet[],
    foes: [] as Enemy[],
    stars: [] as Star[],
    booms: [] as Boom[],
    powers: [] as Power[],
    fireIn: 0,
    spawnIn: 1,
    waveKills: 0,
    waveTarget: 12,
    wave: 1,
    score: 0,
    lives: 3,
    invuln: 0,
    shield: 0,
    rapid: 0,
    spread: 0,
    shake: 0,
    fps: 60,
    fpsAcc: 0,
    fpsCount: 0,
    elapsed: 0,
  });

  useEffect(() => {
    const s = st.current;
    const count = quality === 'low' ? 60 : quality === 'medium' ? 110 : 170;
    s.stars = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() }));
  }, [quality]);

  const start = useCallback(() => {
    const s = st.current;
    s.bullets = [];
    s.foes = [];
    s.booms = [];
    s.powers = [];
    s.score = 0;
    s.lives = 3;
    s.wave = 1;
    s.waveKills = 0;
    s.waveTarget = 12;
    s.spawnIn = 0.8;
    s.invuln = 2;
    s.shield = 0;
    s.rapid = 0;
    s.spread = 0;
    setScore(0);
    setLives(3);
    setWave(1);
    setPower(null);
    setPhase('playing');
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent, down: boolean) {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      const s = st.current;
      if (k === 'arrowleft' || k === 'a') s.keys.l = down;
      if (k === 'arrowright' || k === 'd') s.keys.r = down;
      if (k === 'arrowup' || k === 'w') s.keys.u = down;
      if (k === 'arrowdown' || k === 's') s.keys.d = down;
      if (down && phase !== 'playing' && (k === 'enter' || k === ' ')) start();
    }
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd, { passive: false });
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [phase, start]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const move = (cx: number, cy: number) => {
      const rect = el.getBoundingClientRect();
      st.current.px = Math.min(0.96, Math.max(0.04, (cx - rect.left) / rect.width));
      st.current.py = Math.min(0.94, Math.max(0.45, (cy - rect.top) / rect.height));
    };
    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY - 60);
    el.addEventListener('mousemove', onMouse);
    el.addEventListener('touchmove', onTouch, { passive: true });
    el.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      el.removeEventListener('mousemove', onMouse);
      el.removeEventListener('touchmove', onTouch);
      el.removeEventListener('touchstart', onTouch);
    };
  }, [canvasRef]);

  const running = phase === 'playing' && !paused && size.width > 0;

  const spawn = useCallback(() => {
    const s = st.current;
    const w = size.width;
    const roll = Math.random();
    const isBossWave = s.wave % 5 === 0;
    if (isBossWave && !s.foes.some((f) => f.kind === 'boss') && s.waveKills >= s.waveTarget - 4) {
      s.foes.push({
        x: w / 2,
        y: -80,
        vx: 40,
        vy: 26,
        hp: 40 + s.wave * 8,
        maxHp: 40 + s.wave * 8,
        r: 44,
        kind: 'boss',
        t: 0,
        fireIn: 1.2,
        hue: 340,
      });
      return;
    }
    const kind: Enemy['kind'] = roll > 0.78 ? 'shooter' : roll > 0.45 ? 'zig' : 'drifter';
    const hp = kind === 'shooter' ? 3 : kind === 'zig' ? 2 : 1;
    s.foes.push({
      x: 30 + Math.random() * Math.max(40, w - 60),
      y: -30,
      vx: (Math.random() - 0.5) * 60,
      vy: 52 + Math.random() * 46 + s.wave * 6,
      hp: hp + Math.floor(s.wave / 4),
      maxHp: hp + Math.floor(s.wave / 4),
      r: kind === 'shooter' ? 17 : 14,
      kind,
      t: Math.random() * 10,
      fireIn: 1.4 + Math.random() * 1.6,
      hue: kind === 'shooter' ? 340 : kind === 'zig' ? 190 : 265,
    });
  }, [size.width]);

  useGameLoop((dt, elapsed) => {
    const s = st.current;
    const w = size.width;
    const h = size.height;
    s.elapsed = elapsed;

    s.fpsAcc += dt;
    s.fpsCount++;
    if (s.fpsAcc >= 0.5) {
      s.fps = Math.round(s.fpsCount / s.fpsAcc);
      s.fpsAcc = 0;
      s.fpsCount = 0;
      onTelemetry?.({ fps: s.fps, detail: `wave ${s.wave} · hostiles ${s.foes.length}` });
    }

    if (s.invuln > 0) s.invuln -= dt;
    if (s.shield > 0) s.shield -= dt;
    if (s.rapid > 0) s.rapid -= dt;
    if (s.spread > 0) s.spread -= dt;
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 20);
    if (s.rapid <= 0 && s.spread <= 0 && s.shield <= 0) setPower(null);

    // movement
    const speed = 460;
    if (s.keys.l) s.px -= (speed * dt) / w;
    if (s.keys.r) s.px += (speed * dt) / w;
    if (s.keys.u) s.py -= (speed * dt) / h;
    if (s.keys.d) s.py += (speed * dt) / h;
    s.px = Math.min(0.96, Math.max(0.04, s.px));
    s.py = Math.min(0.94, Math.max(0.42, s.py));

    const px = s.px * w;
    const py = s.py * h;

    // stars
    s.stars.forEach((star) => {
      star.y += (star.z * 120 * dt) / h;
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
      }
    });

    // fire
    s.fireIn -= dt;
    if (s.fireIn <= 0) {
      s.fireIn = s.rapid > 0 ? 0.075 : 0.155;
      const shots = s.spread > 0 ? 3 : 1;
      for (let i = 0; i < shots; i++) {
        const spreadAngle = (i - (shots - 1) / 2) * 0.22;
        s.bullets.push({
          x: px,
          y: py - 16,
          vx: Math.sin(spreadAngle) * 620,
          vy: -Math.cos(spreadAngle) * 720,
          r: 3.4,
          foe: false,
          hue: 190,
        });
      }
      if (!muted) sfx.shoot();
    }

    // spawn
    s.spawnIn -= dt;
    if (s.spawnIn <= 0) {
      s.spawnIn = Math.max(0.28, 1.15 - s.wave * 0.055);
      spawn();
    }

    // enemies
    s.foes.forEach((f) => {
      f.t += dt;
      if (f.kind === 'zig') f.x += Math.sin(f.t * 3.4) * 130 * dt;
      if (f.kind === 'boss') {
        f.x += Math.sin(f.t * 0.9) * 90 * dt;
        if (f.y < h * 0.18) f.y += f.vy * dt;
        f.x = Math.min(w - 60, Math.max(60, f.x));
      } else {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      }
      if (f.x < f.r) f.vx = Math.abs(f.vx);
      if (f.x > w - f.r) f.vx = -Math.abs(f.vx);

      if (f.kind === 'shooter' || f.kind === 'boss') {
        f.fireIn -= dt;
        if (f.fireIn <= 0) {
          f.fireIn = f.kind === 'boss' ? 0.62 : 1.6 + Math.random();
          const count = f.kind === 'boss' ? 5 : 1;
          for (let i = 0; i < count; i++) {
            const angle = Math.PI / 2 + (i - (count - 1) / 2) * 0.3;
            s.bullets.push({
              x: f.x,
              y: f.y + f.r,
              vx: Math.cos(angle) * 210,
              vy: Math.sin(angle) * 210,
              r: 4.4,
              foe: true,
              hue: 345,
            });
          }
        }
      }
    });
    s.foes = s.foes.filter((f) => f.y < h + 90 && f.hp > 0);

    // bullets
    s.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    s.bullets = s.bullets.filter((b) => b.y > -30 && b.y < h + 30 && b.x > -30 && b.x < w + 30);

    // collisions: player bullets -> enemies
    for (const b of s.bullets) {
      if (b.foe) continue;
      for (const f of s.foes) {
        if (f.hp <= 0) continue;
        const dx = b.x - f.x;
        const dy = b.y - f.y;
        if (dx * dx + dy * dy < (f.r + b.r) * (f.r + b.r)) {
          f.hp -= 1;
          b.y = -999;
          if (f.hp <= 0) {
            const gain = f.kind === 'boss' ? 900 : f.kind === 'shooter' ? 90 : 50;
            s.score += gain;
            setScore(s.score);
            s.waveKills += 1;
            s.shake = f.kind === 'boss' ? 12 : 4;
            if (!muted) {
              if (f.kind === 'boss') sfx.explode();
              else sfx.hit();
            }
            const pieces = f.kind === 'boss' ? 60 : 16;
            for (let i = 0; i < pieces; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 60 + Math.random() * (f.kind === 'boss' ? 420 : 220);
              s.booms.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.5, size: 1.5 + Math.random() * 3, hue: f.hue });
            }
            if (Math.random() < (f.kind === 'boss' ? 1 : 0.11)) {
              const kinds: Power['kind'][] = ['spread', 'rapid', 'shield', 'bomb'];
              s.powers.push({ x: f.x, y: f.y, kind: kinds[Math.floor(Math.random() * kinds.length)] });
            }
            if (s.waveKills >= s.waveTarget) {
              s.wave += 1;
              s.waveKills = 0;
              s.waveTarget = 12 + s.wave * 3;
              s.score += 200;
              setWave(s.wave);
              setScore(s.score);
              if (!muted) sfx.win();
            }
          }
          break;
        }
      }
    }

    // enemy bullets / bodies -> player
    const hitRadius = 13;
    const damaged = () => {
      if (s.invuln > 0) return false;
      if (s.shield > 0) {
        s.shield = 0;
        s.invuln = 1.2;
        setPower(null);
        if (!muted) sfx.hit();
        return false;
      }
      s.lives -= 1;
      setLives(s.lives);
      s.invuln = 2.2;
      s.shake = 10;
      s.spread = 0;
      s.rapid = 0;
      setPower(null);
      if (!muted) sfx.explode();
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2;
        s.booms.push({ x: px, y: py, vx: Math.cos(a) * 240 * Math.random(), vy: Math.sin(a) * 240 * Math.random(), life: 0.6, size: 2.4, hue: 200 });
      }
      if (s.lives <= 0) {
        setPhase('over');
        onScore(s.score, 'points', { wave: s.wave, time: Math.round(s.elapsed) });
        if (!muted) sfx.lose();
      }
      return true;
    };

    for (const b of s.bullets) {
      if (!b.foe) continue;
      const dx = b.x - px;
      const dy = b.y - py;
      if (dx * dx + dy * dy < (hitRadius + b.r) * (hitRadius + b.r)) {
        b.y = 99999;
        if (damaged()) return;
      }
    }
    for (const f of s.foes) {
      const dx = f.x - px;
      const dy = f.y - py;
      if (dx * dx + dy * dy < (hitRadius + f.r) * (hitRadius + f.r)) {
        if (damaged()) return;
      }
    }

    // powerups
    s.powers = s.powers.filter((p) => {
      p.y += 96 * dt;
      const dx = p.x - px;
      const dy = p.y - py;
      if (dx * dx + dy * dy < 26 * 26) {
        if (p.kind === 'spread') {
          s.spread = 12;
          setPower('Spread shot');
        } else if (p.kind === 'rapid') {
          s.rapid = 10;
          setPower('Rapid fire');
        } else if (p.kind === 'shield') {
          s.shield = 14;
          setPower('Shield');
        } else {
          s.foes.forEach((f) => {
            if (f.kind !== 'boss') {
              f.hp = 0;
              s.score += 40;
            } else f.hp -= 12;
          });
          s.shake = 14;
          setScore(s.score);
          setPower('Screen clear');
          if (!muted) sfx.explode();
        }
        if (!muted) sfx.eat();
        return false;
      }
      return p.y < h + 30;
    });

    s.booms = s.booms.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      return p.life > 0;
    });
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

      ctx.fillStyle = '#04050c';
      ctx.fillRect(-14, -14, w + 28, h + 28);

      // nebula
      const neb = ctx.createRadialGradient(w * 0.5, h * 0.15, 10, w * 0.5, h * 0.15, h * 0.9);
      neb.addColorStop(0, `${accent}22`);
      neb.addColorStop(1, 'transparent');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      // stars
      s.stars.forEach((star) => {
        ctx.globalAlpha = 0.25 + star.z * 0.75;
        ctx.fillStyle = star.z > 0.75 ? '#ffffff' : '#8fa2c8';
        const sz = star.z * 2.2;
        ctx.fillRect(star.x * w, star.y * h, sz, sz * (1 + star.z * 3));
      });
      ctx.globalAlpha = 1;

      // player
      const px = s.px * w;
      const py = s.py * h;
      const blink = s.invuln > 0 && Math.floor(performance.now() / 90) % 2 === 0;
      if (!blink) {
        ctx.save();
        ctx.translate(px, py);
        ctx.shadowColor = accent;
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#e9edf7';
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(13, 13);
        ctx.lineTo(0, 7);
        ctx.lineTo(-13, 13);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(5, 6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        // thruster
        ctx.globalAlpha = 0.6 + Math.sin(performance.now() / 60) * 0.3;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(-4, 12);
        ctx.lineTo(0, 24 + Math.random() * 6);
        ctx.lineTo(4, 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (s.shield > 0) {
          ctx.strokeStyle = `rgba(167,139,250,${0.45 + Math.sin(performance.now() / 180) * 0.25})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 26, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // enemies
      s.foes.forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.shadowColor = `hsl(${f.hue},90%,60%)`;
        ctx.shadowBlur = 16;
        ctx.fillStyle = `hsl(${f.hue},72%,${f.kind === 'boss' ? 44 : 52}%)`;
        if (f.kind === 'boss') {
          ctx.beginPath();
          ctx.moveTo(0, f.r);
          ctx.lineTo(f.r, -f.r * 0.35);
          ctx.lineTo(f.r * 0.4, -f.r);
          ctx.lineTo(-f.r * 0.4, -f.r);
          ctx.lineTo(-f.r, -f.r * 0.35);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath();
          ctx.arc(0, -f.r * 0.2, f.r * 0.22, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, f.r);
          ctx.lineTo(f.r * 0.9, -f.r * 0.7);
          ctx.lineTo(0, -f.r * 0.35);
          ctx.lineTo(-f.r * 0.9, -f.r * 0.7);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        if (f.maxHp > 1) {
          const bw = f.r * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(f.x - bw / 2, f.y - f.r - 9, bw, 3.5);
          ctx.fillStyle = `hsl(${f.hue},90%,62%)`;
          ctx.fillRect(f.x - bw / 2, f.y - f.r - 9, bw * Math.max(0, f.hp / f.maxHp), 3.5);
        }
      });

      // bullets
      s.bullets.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.foe ? '#fb7185' : '#67e8f9';
        ctx.shadowBlur = 12;
        ctx.fillStyle = b.foe ? '#fda4af' : '#e0fbff';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r * 0.75, b.r * 1.9, Math.atan2(b.vy, b.vx) + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // powerups
      s.powers.forEach((p) => {
        const color = p.kind === 'spread' ? '#22d3ee' : p.kind === 'rapid' ? '#fbbf24' : p.kind === 'shield' ? '#a78bfa' : '#fb7185';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(performance.now() / 700);
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = color;
        ctx.fillRect(-9, -9, 18, 18);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.kind === 'spread' ? 'S' : p.kind === 'rapid' ? 'R' : p.kind === 'shield' ? 'O' : 'B', p.x, p.y + 3.5);
      });

      // explosions
      s.booms.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 1.7);
        ctx.fillStyle = `hsl(${p.hue},95%,${58 + p.life * 22}%)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, size, accent]);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full cursor-crosshair" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          <EngineStat label="Score" value={score.toLocaleString()} accent={accent} />
          <EngineStat label="Wave" value={String(wave)} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <EngineStat label="Hull" value={'▲'.repeat(Math.max(0, lives))} accent="#67e8f9" />
          {power && <EngineStat label="Power" value={power} accent="#fbbf24" />}
        </div>
      </div>
      {phase !== 'playing' && (
        <EngineOverlay
          title={phase === 'over' ? 'Ship destroyed' : 'Star Raider'}
          subtitle={
            phase === 'over'
              ? `You reached wave ${wave} with ${score.toLocaleString()} points.`
              : 'Move with the mouse, WASD or arrow keys — weapons fire automatically. Grab power-ups, survive the boss every fifth wave.'
          }
          accent={accent}
          onStart={start}
          cta={phase === 'over' ? 'Launch again' : 'Launch'}
        />
      )}
    </div>
  );
}
