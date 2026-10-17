'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { makeRandom } from '@/lib/utils';
import type { EngineProps } from '../types';
import { EngineOverlay, EngineStat } from './_shared';

type BlockKey = 'grass' | 'dirt' | 'stone' | 'sand' | 'wood' | 'leaf' | 'glass' | 'glow';

const PALETTE: Record<BlockKey, { color: number; rough: number; emissive?: number; label: string; key: string }> = {
  grass: { color: 0x5fbf5a, rough: 0.92, label: 'Grass', key: '1' },
  dirt: { color: 0x7a5236, rough: 1, label: 'Dirt', key: '2' },
  stone: { color: 0x8a909c, rough: 0.95, label: 'Stone', key: '3' },
  sand: { color: 0xe3d3a1, rough: 1, label: 'Sand', key: '4' },
  wood: { color: 0x9a6b3f, rough: 0.9, label: 'Wood', key: '5' },
  leaf: { color: 0x3f9c4a, rough: 1, label: 'Leaves', key: '6' },
  glass: { color: 0xbfe9ff, rough: 0.15, label: 'Glass', key: '7' },
  glow: { color: 0xffd479, rough: 0.4, emissive: 0xffb020, label: 'Lamp', key: '8' },
};
const KEYS = Object.keys(PALETTE) as BlockKey[];

interface PlayerState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  pitch: number;
  onGround: boolean;
}

export default function VoxelSandbox({ onScore, onTelemetry, paused, muted, quality }: EngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'playing'>('idle');
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<BlockKey>('grass');
  const [hud, setHud] = useState({ x: 0, y: 0, z: 0, fps: 60, mined: 0, placed: 0, blocks: 0 });
  const [error, setError] = useState<string | null>(null);
  const selectedRef = useRef<BlockKey>('grass');
  const pausedRef = useRef(paused);

  const api = useRef<{
    stats: () => { mined: number; placed: number };
    dispose: () => void;
  } | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const start = useCallback(() => {
    setPhase('playing');
    const el = mountRef.current?.querySelector('canvas');
    if (el) void (el as HTMLCanvasElement).requestPointerLock?.();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || phase !== 'playing') return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false });
    } catch {
      setError('WebGL is unavailable in this browser, so the voxel world cannot be rendered.');
      return;
    }

    const worldSize = quality === 'low' ? 34 : quality === 'medium' ? 44 : 54;
    const dprCap = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = quality === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.cursor = 'crosshair';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1a2f);
    scene.fog = new THREE.Fog(0x0d1a2f, worldSize * 0.6, worldSize * 1.9);

    const camera = new THREE.PerspectiveCamera(72, mount.clientWidth / mount.clientHeight, 0.1, 400);

    // ---------- lighting ----------
    const hemi = new THREE.HemisphereLight(0xbcd6ff, 0x2b2418, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.5);
    sun.position.set(worldSize * 0.8, worldSize * 1.4, worldSize * 0.4);
    if (quality === 'high') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = worldSize * 4;
      const d = worldSize;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
    }
    scene.add(sun);

    // stars + moon disc for atmosphere
    const starGeo = new THREE.BufferGeometry();
    const starCount = quality === 'low' ? 220 : 600;
    const starPos = new Float32Array(starCount * 3);
    const rnd = makeRandom(1337);
    for (let i = 0; i < starCount; i++) {
      const r = 180 + rnd() * 60;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.7 + 12;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    // ---------- world generation ----------
    const world = new Map<string, BlockKey>();
    const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

    function noise2(x: number, z: number) {
      const r = makeRandom(Math.imul(x, 73856093) ^ Math.imul(z, 19349663));
      return r();
    }
    function smoothNoise(x: number, z: number, scale: number) {
      const sx = x / scale;
      const sz = z / scale;
      const x0 = Math.floor(sx);
      const z0 = Math.floor(sz);
      const fx = sx - x0;
      const fz = sz - z0;
      const a = noise2(x0, z0);
      const b = noise2(x0 + 1, z0);
      const c = noise2(x0, z0 + 1);
      const d = noise2(x0 + 1, z0 + 1);
      const ux = fx * fx * (3 - 2 * fx);
      const uz = fz * fz * (3 - 2 * fz);
      return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
    }
    function heightAt(x: number, z: number) {
      const base = smoothNoise(x, z, 14) * 6 + smoothNoise(x, z, 6) * 3 + smoothNoise(x, z, 3) * 1.2;
      return Math.max(1, Math.round(base));
    }

    const half = Math.floor(worldSize / 2);
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        const h = heightAt(x, z);
        for (let y = 0; y <= h; y++) {
          let type: BlockKey = 'stone';
          if (y === h) type = h <= 2 ? 'sand' : 'grass';
          else if (y > h - 3) type = 'dirt';
          world.set(key(x, y, z), type);
        }
      }
    }

    // a few trees
    const treeRnd = makeRandom(9001);
    for (let i = 0; i < (quality === 'low' ? 8 : 18); i++) {
      const tx = Math.floor((treeRnd() - 0.5) * worldSize * 0.85);
      const tz = Math.floor((treeRnd() - 0.5) * worldSize * 0.85);
      const th = heightAt(tx, tz);
      if (world.get(key(tx, th, tz)) !== 'grass') continue;
      const trunk = 3 + Math.floor(treeRnd() * 2);
      for (let y = 1; y <= trunk; y++) world.set(key(tx, th + y, tz), 'wood');
      for (let dx = -2; dx <= 2; dx++)
        for (let dz = -2; dz <= 2; dz++)
          for (let dy = 0; dy <= 2; dy++) {
            if (Math.abs(dx) + Math.abs(dz) + dy > 4) continue;
            const k = key(tx + dx, th + trunk + dy, tz + dz);
            if (!world.has(k)) world.set(k, 'leaf');
          }
    }

    // ---------- instanced rendering ----------
    const MAX_INSTANCES = quality === 'low' ? 26000 : 42000;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const meshes = new Map<BlockKey, THREE.InstancedMesh>();
    const instanceIndex = new Map<BlockKey, string[]>();

    KEYS.forEach((k) => {
      const spec = PALETTE[k];
      const material = new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: spec.rough,
        metalness: k === 'glass' ? 0.1 : 0.02,
        emissive: spec.emissive ?? 0x000000,
        emissiveIntensity: spec.emissive ? 1.1 : 0,
        transparent: k === 'glass',
        opacity: k === 'glass' ? 0.42 : 1,
      });
      const mesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
      mesh.count = 0;
      mesh.frustumCulled = false;
      if (quality === 'high') {
        mesh.castShadow = k !== 'glass';
        mesh.receiveShadow = true;
      }
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      meshes.set(k, mesh);
      instanceIndex.set(k, []);
    });

    const dummy = new THREE.Object3D();
    function rebuild() {
      const perType = new Map<BlockKey, number>();
      KEYS.forEach((k) => {
        perType.set(k, 0);
        instanceIndex.set(k, []);
      });

      for (const [k, type] of world) {
        const [xs, ys, zs] = k.split(',');
        const x = Number(xs);
        const y = Number(ys);
        const z = Number(zs);
        const exposed =
          !world.has(key(x + 1, y, z)) ||
          !world.has(key(x - 1, y, z)) ||
          !world.has(key(x, y + 1, z)) ||
          !world.has(key(x, y - 1, z)) ||
          !world.has(key(x, y, z + 1)) ||
          !world.has(key(x, y, z - 1));
        if (!exposed) continue;
        const mesh = meshes.get(type);
        if (!mesh) continue;
        const idx = perType.get(type) ?? 0;
        if (idx >= MAX_INSTANCES) continue;
        dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        perType.set(type, idx + 1);
        instanceIndex.get(type)!.push(k);
      }

      KEYS.forEach((t) => {
        const mesh = meshes.get(t)!;
        mesh.count = perType.get(t) ?? 0;
        mesh.instanceMatrix.needsUpdate = true;
      });
      setHud((h) => ({ ...h, blocks: world.size }));
    }
    rebuild();

    // ---------- highlight ----------
    const highlight = new THREE.Mesh(
      new THREE.BoxGeometry(1.012, 1.012, 1.012),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55 }),
    );
    highlight.visible = false;
    scene.add(highlight);

    // ---------- player ----------
    const player: PlayerState = {
      pos: new THREE.Vector3(0.5, heightAt(0, 0) + 3, 0.5),
      vel: new THREE.Vector3(),
      yaw: 0.6,
      pitch: -0.15,
      onGround: false,
    };
    const keys = new Set<string>();
    const WIDTH = 0.34;
    const HEIGHT = 1.78;
    const EYE = 1.62;

    function solidAt(x: number, y: number, z: number) {
      const t = world.get(key(Math.floor(x), Math.floor(y), Math.floor(z)));
      return t !== undefined && t !== 'glass' ? true : t === 'glass';
    }

    function collides(px: number, py: number, pz: number) {
      const minX = Math.floor(px - WIDTH);
      const maxX = Math.floor(px + WIDTH);
      const minY = Math.floor(py);
      const maxY = Math.floor(py + HEIGHT);
      const minZ = Math.floor(pz - WIDTH);
      const maxZ = Math.floor(pz + WIDTH);
      for (let x = minX; x <= maxX; x++)
        for (let y = minY; y <= maxY; y++)
          for (let z = minZ; z <= maxZ; z++) if (world.has(key(x, y, z))) return true;
      return false;
    }
    void solidAt;

    // ---------- voxel raycast (Amanatides & Woo) ----------
    function raycastVoxel(origin: THREE.Vector3, dir: THREE.Vector3, maxDist = 6.5) {
      let x = Math.floor(origin.x);
      let y = Math.floor(origin.y);
      let z = Math.floor(origin.z);
      const stepX = Math.sign(dir.x);
      const stepY = Math.sign(dir.y);
      const stepZ = Math.sign(dir.z);
      const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dir.x);
      const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dir.y);
      const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dir.z);
      let tMaxX = stepX === 0 ? Infinity : ((stepX > 0 ? x + 1 - origin.x : origin.x - x) || 1e-6) * tDeltaX;
      let tMaxY = stepY === 0 ? Infinity : ((stepY > 0 ? y + 1 - origin.y : origin.y - y) || 1e-6) * tDeltaY;
      let tMaxZ = stepZ === 0 ? Infinity : ((stepZ > 0 ? z + 1 - origin.z : origin.z - z) || 1e-6) * tDeltaZ;
      let normal = new THREE.Vector3();
      let t = 0;
      while (t <= maxDist) {
        if (world.has(key(x, y, z))) return { x, y, z, normal };
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
          x += stepX;
          t = tMaxX;
          tMaxX += tDeltaX;
          normal.set(-stepX, 0, 0);
        } else if (tMaxY < tMaxZ) {
          y += stepY;
          t = tMaxY;
          tMaxY += tDeltaY;
          normal.set(0, -stepY, 0);
        } else {
          z += stepZ;
          t = tMaxZ;
          tMaxZ += tDeltaZ;
          normal.set(0, 0, -stepZ);
        }
      }
      return null;
    }

    // ---------- input ----------
    let mined = 0;
    let placed = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.replace('Digit', ''));
        const k = KEYS[n - 1];
        if (k) {
          setSelected(k);
          selectedRef.current = k;
        }
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyR') {
        player.pos.set(0.5, heightAt(0, 0) + 3, 0.5);
        player.vel.set(0, 0, 0);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      player.yaw -= e.movementX * 0.0022;
      player.pitch -= e.movementY * 0.0022;
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
    };
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) {
        void renderer.domElement.requestPointerLock?.();
        return;
      }
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const hit = raycastVoxel(camera.position.clone(), dir);
      if (!hit) return;
      if (e.button === 0) {
        world.delete(key(hit.x, hit.y, hit.z));
        mined += 1;
        rebuild();
        if (!muted) sfx.break();
      } else if (e.button === 2) {
        const nx = hit.x + hit.normal.x;
        const ny = hit.y + hit.normal.y;
        const nz = hit.z + hit.normal.z;
        const pk = key(nx, ny, nz);
        if (world.has(pk)) return;
        // never place a block inside the player
        const feet = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z);
        if (Math.abs(nx + 0.5 - feet.x) < 1.1 && Math.abs(nz + 0.5 - feet.z) < 1.1 && ny + 1 > feet.y && ny < feet.y + HEIGHT + 0.4) return;
        world.set(pk, selectedRef.current);
        placed += 1;
        rebuild();
        if (!muted) sfx.place();
      }
    };
    const onContext = (e: Event) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const idx = KEYS.indexOf(selectedRef.current);
      const next = (idx + (e.deltaY > 0 ? 1 : -1) + KEYS.length) % KEYS.length;
      setSelected(KEYS[next]);
      selectedRef.current = KEYS[next];
    };
    const onLockChange = () => setLocked(document.pointerLockElement === renderer.domElement);
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', onContext);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('pointerlockchange', onLockChange);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    api.current = {
      stats: () => ({ mined, placed }),
      dispose: () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('contextmenu', onContext);
        renderer.domElement.removeEventListener('wheel', onWheel);
        document.removeEventListener('pointerlockchange', onLockChange);
        ro.disconnect();
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
        cancelAnimationFrame(frame);
        geometry.dispose();
        starGeo.dispose();
        meshes.forEach((m) => {
          (m.material as THREE.Material).dispose();
          m.dispose();
        });
        (highlight.material as THREE.Material).dispose();
        highlight.geometry.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      },
    };

    // ---------- loop ----------
    let frame = 0;
    let last = performance.now();
    let fpsAcc = 0;
    let fpsCount = 0;
    let fps = 60;
    let hudAcc = 0;
    let scoreAcc = 0;
    let time = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fpsAcc += dt;
      fpsCount += 1;
      if (fpsAcc >= 0.5) {
        fps = Math.round(fpsCount / fpsAcc);
        fpsAcc = 0;
        fpsCount = 0;
      }

      if (!pausedRef.current) {
        time += dt;
        // movement
        const speedBase = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8.6 : 5.1;
        const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
        const wish = new THREE.Vector3();
        if (keys.has('KeyW') || keys.has('ArrowUp')) wish.add(forward);
        if (keys.has('KeyS') || keys.has('ArrowDown')) wish.sub(forward);
        if (keys.has('KeyD') || keys.has('ArrowRight')) wish.add(right);
        if (keys.has('KeyA') || keys.has('ArrowLeft')) wish.sub(right);
        if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speedBase);

        player.vel.x = wish.x;
        player.vel.z = wish.z;
        player.vel.y -= 24 * dt;
        if (player.vel.y < -46) player.vel.y = -46;
        if ((keys.has('Space')) && player.onGround) {
          player.vel.y = 8.4;
          player.onGround = false;
          if (!muted) sfx.jump();
        }

        // resolve per-axis
        const next = player.pos.clone();
        next.x += player.vel.x * dt;
        if (collides(next.x, next.y, next.z)) {
          next.x = player.pos.x;
          player.vel.x = 0;
        }
        next.z += player.vel.z * dt;
        if (collides(next.x, next.y, next.z)) {
          next.z = player.pos.z;
          player.vel.z = 0;
        }
        next.y += player.vel.y * dt;
        if (collides(next.x, next.y, next.z)) {
          if (player.vel.y < 0) player.onGround = true;
          next.y = player.pos.y;
          player.vel.y = 0;
        } else {
          player.onGround = false;
        }
        player.pos.copy(next);

        if (player.pos.y < -24) {
          player.pos.set(0.5, heightAt(0, 0) + 4, 0.5);
          player.vel.set(0, 0, 0);
        }

        camera.position.set(player.pos.x, player.pos.y + EYE, player.pos.z);
        camera.rotation.set(0, 0, 0);
        camera.rotateY(player.yaw);
        camera.rotateX(player.pitch);

        // highlight targeted block
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const hit = raycastVoxel(camera.position.clone(), dir);
        if (hit) {
          highlight.visible = true;
          highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        } else {
          highlight.visible = false;
        }

        // slow day-night drift
        const sunAngle = time * 0.035;
        sun.position.set(Math.cos(sunAngle) * worldSize * 1.3, Math.abs(Math.sin(sunAngle)) * worldSize * 1.2 + 12, Math.sin(sunAngle) * worldSize * 0.7);
        const dayFactor = Math.max(0.16, Math.sin(sunAngle));
        sun.intensity = 0.35 + dayFactor * 1.5;
        hemi.intensity = 0.35 + dayFactor * 0.85;
        const skyColor = new THREE.Color(0x0d1a2f).lerp(new THREE.Color(0x74a9e8), dayFactor * 0.85);
        (scene.background as THREE.Color).copy(skyColor);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(skyColor);
        stars.visible = dayFactor < 0.45;

        hudAcc += dt;
        if (hudAcc > 0.25) {
          hudAcc = 0;
          setHud({
            x: Math.round(player.pos.x),
            y: Math.round(player.pos.y),
            z: Math.round(player.pos.z),
            fps,
            mined,
            placed,
            blocks: world.size,
          });
          onTelemetry?.({ fps, detail: `${world.size} blocks loaded` });
        }

        scoreAcc += dt;
        if (scoreAcc >= 25) {
          scoreAcc = 0;
          onScore(mined * 8 + placed * 12, 'blocks', { mined, placed, blocks: world.size });
        }
      }

      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      api.current?.dispose();
      api.current = null;
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
    <div className="relative h-full w-full bg-[#0d1a2f]">
      <div ref={mountRef} className="h-full w-full" />

      {phase === 'playing' && (
        <>
          {/* crosshair */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-5 w-5">
              <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-white/75" />
              <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-white/75" />
            </div>
          </div>

          {/* top HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <EngineStat label="Position" value={`${hud.x} ${hud.y} ${hud.z}`} />
              <EngineStat label="Blocks" value={hud.blocks.toLocaleString()} accent="#4ade80" />
            </div>
            <div className="flex gap-2">
              <EngineStat label="Mined" value={String(hud.mined)} accent="#fbbf24" />
              <EngineStat label="Placed" value={String(hud.placed)} accent="#22d3ee" />
              <EngineStat label="FPS" value={String(hud.fps)} />
            </div>
          </div>

          {/* hotbar */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex justify-center p-3">
            <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
              {KEYS.map((k) => {
                const spec = PALETTE[k];
                const active = k === selected;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      setSelected(k);
                      selectedRef.current = k;
                    }}
                    className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-xl border transition-all duration-150 ${
                      active ? 'scale-105 border-white/70 bg-white/15' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.09]'
                    }`}
                    title={spec.label}
                  >
                    <span
                      className="h-5 w-5 rounded-[5px] border border-black/30"
                      style={{ background: `#${spec.color.toString(16).padStart(6, '0')}`, boxShadow: spec.emissive ? `0 0 10px #${spec.emissive.toString(16).padStart(6, '0')}` : undefined }}
                    />
                    <span className="mt-1 font-mono text-[9px] font-bold text-white/60">{spec.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!locked && (
            <button
              onClick={() => {
                const el = mountRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
                el?.requestPointerLock?.();
              }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 text-[13.5px] font-semibold text-white/85 backdrop-blur-[2px]"
            >
              Click to capture mouse · WASD move · Space jump · Left click mine · Right click place · 1-8 select block · R respawn · Esc release
            </button>
          )}
        </>
      )}

      {phase === 'idle' && (
        <EngineOverlay
          title="Dashcraft Voxel"
          subtitle="An infinite-feel voxel sandbox rendered live with WebGL. Mine, build, plant forests and light up the night — progress stays in this session."
          accent="#4ade80"
          onStart={start}
          cta="Enter world"
        >
          <div className="mt-4 grid grid-cols-2 gap-2 text-left text-[11.5px] text-white/55">
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">WASD — move</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">Mouse — look</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">Space — jump</span>
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">L/R click — mine/place</span>
          </div>
        </EngineOverlay>
      )}
    </div>
  );
}
