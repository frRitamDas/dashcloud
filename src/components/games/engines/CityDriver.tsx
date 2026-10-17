'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { makeRandom } from '@/lib/utils';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

const GRID = 9; // road lines per axis
const CELL = 64; // spacing between road centres
const ROAD_W = 14;
const WORLD = GRID * CELL;
const HALF = WORLD / 2;

interface TrafficCar {
  axis: 'x' | 'z';
  lane: number;
  dir: 1 | -1;
  t: number;
  speed: number;
  hue: number;
}

export default function CityDriver({ onScore, onTelemetry, paused, muted, quality }: EngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'idle' | 'playing'>('idle');
  const [hud, setHud] = useState({ speed: 0, gear: 'N', distance: 0, time: 0, fps: 60, near: 'Downtown' });
  const [cameraMode, setCameraMode] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(paused);
  const cameraModeRef = useRef(0);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const start = useCallback(() => setPhase('playing'), []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || phase !== 'playing') return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', powerPreference: 'high-performance' });
    } catch {
      setError('WebGL is unavailable in this browser, so the city cannot be rendered.');
      return;
    }

    const dprCap = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b18);
    scene.fog = new THREE.FogExp2(0x070b18, quality === 'low' ? 0.0052 : 0.0034);

    const camera = new THREE.PerspectiveCamera(66, mount.clientWidth / mount.clientHeight, 0.4, 1400);
    const rnd = makeRandom(424242);

    // ---------- lighting ----------
    scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x0a0c16, 0.85));
    const moon = new THREE.DirectionalLight(0xbfd2ff, 0.85);
    moon.position.set(-180, 260, 120);
    scene.add(moon);
    const warm = new THREE.DirectionalLight(0xff9d5c, 0.32);
    warm.position.set(220, 90, -180);
    scene.add(warm);

    // ---------- ground texture (roads + markings + sidewalks) ----------
    function makeCityTexture() {
      const px = 12; // texture pixels per world unit
      const size = Math.min(2048, WORLD * px);
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const g = c.getContext('2d')!;
      const scale = size / WORLD;

      g.fillStyle = '#10131c';
      g.fillRect(0, 0, size, size);

      // blocks / sidewalks
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const x = (-HALF + i * CELL + ROAD_W / 2) * scale;
          const y = (-HALF + j * CELL + ROAD_W / 2) * scale;
          const w = (CELL - ROAD_W) * scale;
          g.fillStyle = '#171b26';
          g.fillRect(x, y, w, w);
          g.strokeStyle = 'rgba(255,255,255,0.06)';
          g.lineWidth = Math.max(1, scale * 0.4);
          g.strokeRect(x, y, w, w);
        }
      }

      // roads
      g.fillStyle = '#20242f';
      for (let i = 0; i <= GRID; i++) {
        const p = (-HALF + i * CELL) * scale;
        g.fillRect(p - (ROAD_W / 2) * scale, 0, ROAD_W * scale, size);
        g.fillRect(0, p - (ROAD_W / 2) * scale, size, ROAD_W * scale);
      }

      // lane markings
      g.strokeStyle = 'rgba(240,220,150,0.65)';
      g.lineWidth = Math.max(1.4, scale * 0.55);
      g.setLineDash([scale * 3.2, scale * 3.2]);
      for (let i = 0; i <= GRID; i++) {
        const p = (-HALF + i * CELL) * scale;
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, size);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(size, p);
        g.stroke();
      }
      g.setLineDash([]);

      // crosswalks at intersections
      g.fillStyle = 'rgba(235,240,250,0.4)';
      for (let i = 0; i <= GRID; i++) {
        for (let j = 0; j <= GRID; j++) {
          const cx = (-HALF + i * CELL) * scale;
          const cy = (-HALF + j * CELL) * scale;
          for (let k = 0; k < 5; k++) {
            const off = (k - 2) * scale * 2.1;
            g.fillRect(cx - (ROAD_W / 2) * scale, cy + off - scale * 0.6 + (ROAD_W / 2) * scale, ROAD_W * scale, scale * 1.1);
            g.fillRect(cx + off - scale * 0.6 - (ROAD_W / 2) * scale, cy - (ROAD_W / 2) * scale, scale * 1.1, ROAD_W * scale);
          }
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = quality === 'high' ? 8 : 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const cityTex = makeCityTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD, WORLD),
      new THREE.MeshStandardMaterial({ map: cityTex, roughness: 0.94, metalness: 0.02 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = quality === 'high';
    scene.add(ground);

    // outer dark plane so driving to the edge still looks intentional
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(WORLD * 4, WORLD * 4), new THREE.MeshBasicMaterial({ color: 0x05070d }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.06;
    scene.add(outer);

    // ---------- buildings ----------
    function makeWindowTexture() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 256;
      const g = c.getContext('2d')!;
      g.fillStyle = '#141824';
      g.fillRect(0, 0, 128, 256);
      const r = makeRandom(777);
      for (let y = 8; y < 250; y += 16) {
        for (let x = 8; x < 122; x += 16) {
          const lit = r() > 0.42;
          g.fillStyle = lit ? `rgba(${200 + Math.floor(r() * 55)},${180 + Math.floor(r() * 60)},${110 + Math.floor(r() * 70)},${0.55 + r() * 0.45})` : 'rgba(90,110,150,0.14)';
          g.fillRect(x, y, 9, 10);
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const windowTex = makeWindowTexture();

    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      emissiveMap: windowTex,
      emissive: new THREE.Color(0xffd9a0),
      emissiveIntensity: quality === 'low' ? 0.35 : 0.62,
      roughness: 0.72,
      metalness: 0.16,
    });
    const MAX_BUILDINGS = 2600;
    const buildings = new THREE.InstancedMesh(buildingGeo, buildingMat, MAX_BUILDINGS);
    buildings.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    scene.add(buildings);

    // collision grid (4-unit resolution)
    const CRES = 4;
    const CDIM = Math.ceil(WORLD / CRES) + 2;
    const solid = new Uint8Array(CDIM * CDIM);
    const solidIndex = (x: number, z: number) => {
      const gx = Math.floor((x + HALF) / CRES) + 1;
      const gz = Math.floor((z + HALF) / CRES) + 1;
      if (gx < 0 || gz < 0 || gx >= CDIM || gz >= CDIM) return -1;
      return gz * CDIM + gx;
    };
    const markSolid = (minX: number, maxX: number, minZ: number, maxZ: number) => {
      for (let x = minX; x <= maxX; x += CRES / 2) {
        for (let z = minZ; z <= maxZ; z += CRES / 2) {
          const idx = solidIndex(x, z);
          if (idx >= 0) solid[idx] = 1;
        }
      }
    };
    const isSolid = (x: number, z: number) => {
      const idx = solidIndex(x, z);
      return idx >= 0 && solid[idx] === 1;
    };

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let bCount = 0;
    const districts = ['Downtown', 'Harbour Row', 'Neon District', 'Old Quarter', 'Industrial East', 'Uptown'];

    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const bx = -HALF + i * CELL + ROAD_W / 2;
        const bz = -HALF + j * CELL + ROAD_W / 2;
        const bsize = CELL - ROAD_W - 4;
        const distFromCentre = Math.hypot(bx + bsize / 2, bz + bsize / 2) / HALF;
        const lots = 2;
        for (let li = 0; li < lots; li++) {
          for (let lj = 0; lj < lots; lj++) {
            if (rnd() < 0.14) continue; // empty lot / park
            const lotW = bsize / lots - 3;
            const w = lotW * (0.6 + rnd() * 0.4);
            const d = lotW * (0.6 + rnd() * 0.4);
            const maxH = 22 + (1 - distFromCentre) * 78;
            const h = 9 + rnd() * maxH;
            const x = bx + 2 + li * (bsize / lots) + lotW / 2 + (rnd() - 0.5) * 2;
            const z = bz + 2 + lj * (bsize / lots) + lotW / 2 + (rnd() - 0.5) * 2;
            if (bCount >= MAX_BUILDINGS) break;
            dummy.position.set(x, h / 2, z);
            dummy.scale.set(w, h, d);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            buildings.setMatrixAt(bCount, dummy.matrix);
            const tint = 0.72 + rnd() * 0.4;
            color.setRGB(tint * (0.85 + rnd() * 0.2), tint * (0.87 + rnd() * 0.16), tint);
            buildings.setColorAt(bCount, color);
            bCount++;
            markSolid(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
          }
        }
      }
    }
    buildings.count = bCount;
    buildings.instanceMatrix.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;

    // ---------- street lights ----------
    const lampGeo = new THREE.BoxGeometry(0.5, 7.5, 0.5);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2b3242, roughness: 0.7, metalness: 0.5 });
    const bulbGeo = new THREE.SphereGeometry(0.62, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
    const lampPositions: THREE.Vector3[] = [];
    for (let i = 0; i <= GRID; i++) {
      for (let j = 0; j <= GRID; j++) {
        const x = -HALF + i * CELL;
        const z = -HALF + j * CELL;
        lampPositions.push(new THREE.Vector3(x + ROAD_W / 2 + 1.4, 0, z + ROAD_W / 2 + 1.4));
      }
    }
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, lampPositions.length);
    const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, lampPositions.length);
    lampPositions.forEach((p, idx) => {
      dummy.position.set(p.x, 3.75, p.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      lamps.setMatrixAt(idx, dummy.matrix);
      dummy.position.set(p.x, 7.4, p.z);
      dummy.updateMatrix();
      bulbs.setMatrixAt(idx, dummy.matrix);
    });
    scene.add(lamps, bulbs);

    // ---------- traffic ----------
    const trafficCount = quality === 'low' ? 14 : quality === 'medium' ? 26 : 40;
    const carGeo = new THREE.BoxGeometry(2.1, 1.15, 4.4);
    const carMat = new THREE.MeshStandardMaterial({ roughness: 0.34, metalness: 0.62 });
    const traffic = new THREE.InstancedMesh(carGeo, carMat, trafficCount);
    traffic.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(traffic);
    const cars: TrafficCar[] = Array.from({ length: trafficCount }, () => {
      const axis: 'x' | 'z' = rnd() > 0.5 ? 'x' : 'z';
      const dir: 1 | -1 = rnd() > 0.5 ? 1 : -1;
      return {
        axis,
        lane: Math.floor(rnd() * (GRID + 1)),
        dir,
        t: rnd() * WORLD - HALF,
        speed: 13 + rnd() * 15,
        hue: Math.floor(rnd() * 360),
      };
    });
    cars.forEach((c, i) => {
      color.setHSL(c.hue / 360, 0.62, 0.52);
      traffic.setColorAt(i, color);
    });
    if (traffic.instanceColor) traffic.instanceColor.needsUpdate = true;

    const carPosition = (c: TrafficCar) => {
      const offset = c.dir * 3.4;
      const lanePos = -HALF + c.lane * CELL + offset;
      return c.axis === 'x' ? new THREE.Vector3(c.t, 0.62, lanePos) : new THREE.Vector3(lanePos, 0.62, c.t);
    };

    // ---------- player car ----------
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf1f4fb, roughness: 0.24, metalness: 0.78 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0d1424, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.82 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 4.5), bodyMat);
    body.position.y = 0.62;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.62, 2.1), glassMat);
    cabin.position.set(0, 1.14, -0.15);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.42), bodyMat);
    spoiler.position.set(0, 1.12, -2.1);
    car.add(body, cabin, spoiler);

    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.9 });
    const wheels: THREE.Mesh[] = [];
    [
      [-0.95, 0.44, 1.45],
      [0.95, 0.44, 1.45],
      [-0.95, 0.44, -1.45],
      [0.95, 0.44, -1.45],
    ].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, y, z);
      car.add(w);
      wheels.push(w);
    });

    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
    [-0.62, 0.62].forEach((x) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), headMat);
      l.position.set(x, 0.66, 2.26);
      car.add(l);
    });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3b52 });
    [-0.66, 0.66].forEach((x) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.07), tailMat);
      l.position.set(x, 0.7, -2.26);
      car.add(l);
    });

    const headLight = new THREE.SpotLight(0xfff0d2, quality === 'low' ? 0 : 190, 90, 0.52, 0.42, 1.4);
    headLight.position.set(0, 1.1, 2);
    headLight.target.position.set(0, 0, 40);
    car.add(headLight, headLight.target);

    const state = {
      pos: new THREE.Vector3(ROAD_W / 2 + 3.4, 0, -CELL * 1.5),
      heading: 0,
      speed: 0,
      steer: 0,
      distance: 0,
      elapsed: 0,
      shake: 0,
    };
    car.position.copy(state.pos);
    scene.add(car);

    // ---------- input ----------
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyC') setCameraMode((m) => (m + 1) % 3);
      if (e.code === 'KeyR') {
        state.pos.set(ROAD_W / 2 + 3.4, 0, -CELL * 1.5);
        state.speed = 0;
        state.heading = 0;
      }
      if (e.code === 'KeyH' && !muted) sfx.click();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onBlur = () => keys.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ---------- minimap ----------
    const mapCanvas = mapRef.current;
    const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;
    if (mapCanvas && mapCtx) {
      mapCanvas.width = 340;
      mapCanvas.height = 340;
    }
    function drawMap() {
      if (!mapCtx || !mapCanvas) return;
      const g = mapCtx;
      const S = mapCanvas.width;
      g.clearRect(0, 0, S, S);
      g.fillStyle = 'rgba(6,8,14,0.86)';
      g.fillRect(0, 0, S, S);
      const view = 260; // world units shown
      const k = S / view;
      const cx = state.pos.x;
      const cz = state.pos.z;

      g.strokeStyle = 'rgba(255,255,255,0.16)';
      g.lineWidth = Math.max(1.5, ROAD_W * k * 0.5);
      for (let i = 0; i <= GRID; i++) {
        const p = -HALF + i * CELL;
        const sx = (p - cx) * k + S / 2;
        const sy = (p - cz) * k + S / 2;
        g.beginPath();
        g.moveTo(sx, 0);
        g.lineTo(sx, S);
        g.stroke();
        g.beginPath();
        g.moveTo(0, sy);
        g.lineTo(S, sy);
        g.stroke();
      }

      cars.forEach((c) => {
        const p = carPosition(c);
        const x = (p.x - cx) * k + S / 2;
        const y = (p.z - cz) * k + S / 2;
        if (x < -6 || y < -6 || x > S + 6 || y > S + 6) return;
        g.fillStyle = 'rgba(251,191,36,0.9)';
        g.beginPath();
        g.arc(x, y, 2.6, 0, Math.PI * 2);
        g.fill();
      });

      // player
      g.save();
      g.translate(S / 2, S / 2);
      g.rotate(-state.heading);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(0, -7);
      g.lineTo(5, 6);
      g.lineTo(0, 3.4);
      g.lineTo(-5, 6);
      g.closePath();
      g.fill();
      g.restore();

      g.strokeStyle = 'rgba(255,255,255,0.14)';
      g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, S - 1, S - 1);
    }

    // ---------- loop ----------
    let frame = 0;
    let last = performance.now();
    let fpsAcc = 0;
    let fpsCount = 0;
    let fps = 60;
    let hudAcc = 0;
    let scoreAcc = 0;
    let disposed = false;

    const camTarget = new THREE.Vector3();
    const camDesired = new THREE.Vector3();

    const tick = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      fpsAcc += dt;
      fpsCount++;
      if (fpsAcc >= 0.5) {
        fps = Math.round(fpsCount / fpsAcc);
        fpsAcc = 0;
        fpsCount = 0;
      }

      if (!pausedRef.current) {
        state.elapsed += dt;
        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 14);

        // --- driving model ---
        const throttle = keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0;
        const brake = keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0;
        const left = keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0;
        const right = keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0;
        const handbrake = keys.has('Space') ? 1 : 0;

        const maxSpeed = 62; // m/s  ≈ 223 km/h
        const accel = 21;
        const reverseMax = -16;

        if (throttle) state.speed += accel * dt * (1 - Math.max(0, state.speed) / maxSpeed);
        if (brake) state.speed -= (state.speed > 0 ? 34 : 13) * dt;
        if (!throttle && !brake) state.speed *= 1 - 0.62 * dt;
        if (handbrake) state.speed *= 1 - 1.5 * dt;
        state.speed = Math.max(reverseMax, Math.min(maxSpeed, state.speed));
        if (Math.abs(state.speed) < 0.06) state.speed = 0;

        const steerInput = (left ? 1 : 0) - (right ? 1 : 0);
        const speedFactor = Math.min(1, Math.abs(state.speed) / 26);
        const targetSteer = steerInput * (0.62 - speedFactor * 0.34);
        state.steer += (targetSteer - state.steer) * Math.min(1, dt * 9);
        const turnRate = state.steer * (state.speed / 12) * (handbrake ? 1.5 : 1);
        state.heading += turnRate * dt;

        const dirX = Math.sin(state.heading);
        const dirZ = Math.cos(state.heading);
        const nextX = state.pos.x + dirX * state.speed * dt;
        const nextZ = state.pos.z + dirZ * state.speed * dt;

        // collisions with buildings (probe the four corners of the car footprint)
        const probes = [
          [nextX + dirX * 2.2, nextZ + dirZ * 2.2],
          [nextX - dirX * 2.2, nextZ - dirZ * 2.2],
          [nextX + dirZ * 1.05, nextZ - dirX * 1.05],
          [nextX - dirZ * 1.05, nextZ + dirX * 1.05],
        ];
        let blocked = false;
        for (const [px, pz] of probes) {
          if (isSolid(px, pz)) {
            blocked = true;
            break;
          }
        }
        const outOfBounds = Math.abs(nextX) > HALF - 4 || Math.abs(nextZ) > HALF - 4;
        if (blocked || outOfBounds) {
          state.speed *= -0.24;
          state.shake = 7;
          if (!muted) sfx.hit();
        } else {
          state.pos.x = nextX;
          state.pos.z = nextZ;
          state.distance += Math.abs(state.speed) * dt;
        }

        // traffic collisions
        cars.forEach((c) => {
          const p = carPosition(c);
          const d = Math.hypot(p.x - state.pos.x, p.z - state.pos.z);
          if (d < 3.4) {
            state.speed *= 0.45;
            state.shake = Math.max(state.shake, 5);
            if (!muted) sfx.hit();
          }
        });

        // move traffic
        cars.forEach((c) => {
          c.t += c.dir * c.speed * dt;
          if (c.t > HALF + 40) c.t = -HALF - 40;
          if (c.t < -HALF - 40) c.t = HALF + 40;
        });

        car.position.set(state.pos.x, 0, state.pos.z);
        car.rotation.y = state.heading;
        const drift = handbrake && Math.abs(state.speed) > 10 ? Math.sin(now / 90) * 0.05 : 0;
        car.rotation.z = -state.steer * 0.07 + drift;
        car.rotation.x = Math.max(-0.03, Math.min(0.03, (throttle - brake) * 0.02));
        wheels.forEach((w, i) => {
          w.rotation.x -= (state.speed * dt) / 0.44;
          if (i < 2) w.rotation.y = state.steer * 0.42;
        });

        if (!muted && Math.abs(state.speed) > 6 && Math.random() < dt * 6) sfx.engine(Math.min(1, Math.abs(state.speed) / maxSpeed));

        // camera
        const mode = cameraModeRef.current;
        if (mode === 0) {
          camDesired.set(state.pos.x - dirX * 11, 5.2, state.pos.z - dirZ * 11);
          camTarget.set(state.pos.x + dirX * 6, 1.4, state.pos.z + dirZ * 6);
        } else if (mode === 1) {
          camDesired.set(state.pos.x + dirX * 0.2, 1.65, state.pos.z + dirZ * 0.2);
          camTarget.set(state.pos.x + dirX * 30, 1.3, state.pos.z + dirZ * 30);
        } else {
          const orbit = now / 2600;
          camDesired.set(state.pos.x + Math.cos(orbit) * 16, 8.5, state.pos.z + Math.sin(orbit) * 16);
          camTarget.set(state.pos.x, 1, state.pos.z);
        }
        if (state.shake > 0) {
          camDesired.x += (Math.random() - 0.5) * state.shake * 0.06;
          camDesired.y += (Math.random() - 0.5) * state.shake * 0.05;
        }
        const smoothing = mode === 1 ? 1 : Math.min(1, dt * 6.5);
        camera.position.lerp(camDesired, smoothing);
        camera.lookAt(camTarget);
        camera.fov = 66 + Math.min(16, Math.abs(state.speed) * 0.26);
        camera.updateProjectionMatrix();

        // traffic instances
        cars.forEach((c, i) => {
          const p = carPosition(c);
          dummy.position.copy(p);
          dummy.rotation.set(0, c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : c.dir > 0 ? 0 : Math.PI, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          traffic.setMatrixAt(i, dummy.matrix);
        });
        traffic.instanceMatrix.needsUpdate = true;

        hudAcc += dt;
        if (hudAcc > 0.14) {
          hudAcc = 0;
          const kmh = Math.abs(state.speed) * 3.6;
          const gear = state.speed < -0.4 ? 'R' : Math.abs(state.speed) < 0.4 ? 'N' : `${Math.min(6, Math.floor(kmh / 38) + 1)}`;
          const district = districts[Math.min(districts.length - 1, Math.floor((Math.hypot(state.pos.x, state.pos.z) / HALF) * districts.length))];
          setHud({ speed: Math.round(kmh), gear, distance: Math.round(state.distance), time: Math.round(state.elapsed), fps, near: district });
          onTelemetry?.({ fps, detail: `${Math.round(state.distance)} m driven` });
          drawMap();
        }

        scoreAcc += dt;
        if (scoreAcc >= 20) {
          scoreAcc = 0;
          onScore(Math.round(state.distance), 'metres', { time: Math.round(state.elapsed), topSpeed: Math.round(Math.abs(state.speed) * 3.6) });
        }
      }

      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      ro.disconnect();
      [cityTex, windowTex, buildingGeo, buildingMat, lampGeo, lampMat, bulbGeo, bulbMat, carGeo, carMat, wheelGeo, wheelMat].forEach((r) =>
        (r as { dispose?: () => void }).dispose?.(),
      );
      buildings.dispose();
      traffic.dispose();
      lamps.dispose();
      bulbs.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      outer.geometry.dispose();
      (outer.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [muted, onScore, onTelemetry, phase, quality]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#07080f] p-6">
        <p className="max-w-md text-center text-[13.5px] text-[color:var(--text-dim)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070b18]">
      <div ref={mountRef} className="h-full w-full" />

      {phase === 'playing' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <EngineStat label="Speed" value={`${hud.speed}`} accent="#f97316" />
              <EngineStat label="Gear" value={hud.gear} />
              <EngineStat label="District" value={hud.near} accent="#22d3ee" />
            </div>
            <div className="flex gap-2">
              <EngineStat label="Distance" value={`${(hud.distance / 1000).toFixed(2)} km`} />
              <EngineStat label="Time" value={`${Math.floor(hud.time / 60)}:${String(hud.time % 60).padStart(2, '0')}`} />
              <EngineStat label="FPS" value={String(hud.fps)} />
            </div>
          </div>

          <div className="pointer-events-none absolute right-3 top-20 hidden rounded-xl border border-white/10 bg-black/45 p-1.5 backdrop-blur-md sm:right-4 sm:top-24 sm:block">
            <canvas ref={mapRef} className="h-[132px] w-[132px] rounded-lg sm:h-[168px] sm:w-[168px]" />
            <div className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Live map</div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
            <p className="hidden max-w-md rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-[11px] leading-relaxed text-white/55 backdrop-blur-md sm:block">
              <span className="font-semibold text-white/80">WASD</span> drive · <span className="font-semibold text-white/80">Space</span> handbrake drift ·{' '}
              <span className="font-semibold text-white/80">C</span> camera · <span className="font-semibold text-white/80">R</span> reset
            </p>
            <button
              onClick={() => setCameraMode((m) => (m + 1) % 3)}
              className="pointer-events-auto rounded-lg border border-white/12 bg-black/55 px-3 py-2 text-[11.5px] font-semibold text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
            >
              Camera · {['Chase', 'Cockpit', 'Cinematic'][cameraMode]}
            </button>
          </div>
        </>
      )}

      {phase === 'idle' && (
        <EngineOverlay
          title="Dash City Auto"
          subtitle="A procedurally built night city with live traffic, street lighting and a radar minimap. Drive it, drift it, wreck it — nothing to download."
          accent="#f97316"
          onStart={start}
          cta="Start engine"
        >
          <div className="mt-4 grid grid-cols-2 gap-2 text-left text-[11.5px] text-white/55">
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">W / S — throttle & brake</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">A / D — steer</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">Space — handbrake</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">C — camera · R — reset</span>
          </div>
        </EngineOverlay>
      )}
    </div>
  );
}
