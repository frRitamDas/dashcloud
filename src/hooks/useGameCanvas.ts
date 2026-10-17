'use client';

import { useEffect, useRef, useState } from 'react';

export interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

/**
 * Keeps a canvas element sized to its container at the display's pixel ratio,
 * capped so 3x phones don't push millions of extra pixels per frame.
 */
export function useGameCanvas<T extends HTMLCanvasElement>(maxDpr = 2) {
  const canvasRef = useRef<T | null>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function apply() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setSize((prev) => (prev.width === width && prev.height === height && prev.dpr === dpr ? prev : { width, height, dpr }));
    }

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(canvas);
    window.addEventListener('orientationchange', apply);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', apply);
    };
  }, [maxDpr]);

  return { canvasRef, size };
}

/** Fixed-timestep rAF loop that stops entirely while paused or tab-hidden. */
export function useGameLoop(callback: (dt: number, elapsed: number) => void, running: boolean) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      cbRef.current(dt, elapsed);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
}
