'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { EngineMeta, EngineProps } from './types';
import { Spinner } from '@/components/ui/Skeleton';

function EngineLoader({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#07080f]">
      <Spinner size={22} />
      <p className="text-[12.5px] text-[color:var(--text-faint)]">Loading {label}…</p>
    </div>
  );
}

const lazy = (label: string, loader: () => Promise<{ default: ComponentType<EngineProps> }>) =>
  dynamic(loader, { ssr: false, loading: () => <EngineLoader label={label} /> });

export const ENGINES: Record<string, { meta: EngineMeta; Component: ComponentType<EngineProps> }> = {
  'voxel-sandbox': {
    meta: {
      key: 'voxel-sandbox',
      name: 'Dashcraft Voxel Engine',
      blurb: 'WebGL voxel renderer with procedural terrain, day/night lighting and first-person physics.',
      controls: [
        { keys: 'WASD', action: 'Move' },
        { keys: 'Mouse', action: 'Look around' },
        { keys: 'Space', action: 'Jump' },
        { keys: 'Left click', action: 'Mine block' },
        { keys: 'Right click', action: 'Place block' },
        { keys: '1 – 8', action: 'Select material' },
        { keys: 'R', action: 'Respawn' },
      ],
      metric: 'blocks',
      heavy: true,
    },
    Component: lazy('the voxel world', () => import('./engines/VoxelSandbox')),
  },
  'city-driver': {
    meta: {
      key: 'city-driver',
      name: 'Dash City Driving Engine',
      blurb: 'Procedural night city, live traffic AI, arcade drift physics and a real-time radar minimap.',
      controls: [
        { keys: 'W / S', action: 'Throttle & brake' },
        { keys: 'A / D', action: 'Steer' },
        { keys: 'Space', action: 'Handbrake drift' },
        { keys: 'C', action: 'Change camera' },
        { keys: 'R', action: 'Reset position' },
      ],
      metric: 'metres',
      heavy: true,
    },
    Component: lazy('the city', () => import('./engines/CityDriver')),
  },
  'neon-snake': {
    meta: {
      key: 'neon-snake',
      name: 'Neon Arcade Engine',
      blurb: 'Grid-based arcade simulation with light trails, bonus pickups and escalating speed.',
      controls: [
        { keys: 'Arrows / WASD', action: 'Steer' },
        { keys: 'Swipe', action: 'Steer on touch' },
        { keys: 'Space', action: 'Start / restart' },
      ],
      metric: 'points',
    },
    Component: lazy('Neon Serpent', () => import('./engines/NeonSnake')),
  },
  'brick-blaster': {
    meta: {
      key: 'brick-blaster',
      name: 'Brick Physics Engine',
      blurb: 'Breakout-style physics with multi-ball, power-up drops, combos and endless levels.',
      controls: [
        { keys: 'Mouse / touch', action: 'Move paddle' },
        { keys: 'Space / click', action: 'Launch ball' },
      ],
      metric: 'points',
    },
    Component: lazy('Brick Nova', () => import('./engines/BrickNova')),
  },
  'star-raider': {
    meta: {
      key: 'star-raider',
      name: 'Star Raider Engine',
      blurb: 'Wave-based space combat with bullet patterns, power-ups and a boss every fifth wave.',
      controls: [
        { keys: 'Mouse / WASD', action: 'Fly' },
        { keys: 'Auto', action: 'Weapons fire automatically' },
      ],
      metric: 'points',
    },
    Component: lazy('Star Raider', () => import('./engines/StarRaider')),
  },
  'dash-2048': {
    meta: {
      key: 'dash-2048',
      name: 'Merge Puzzle Engine',
      blurb: 'The classic merge puzzle with animated tiles, swipe support and score tracking.',
      controls: [
        { keys: 'Arrows / WASD', action: 'Slide board' },
        { keys: 'Swipe', action: 'Slide on touch' },
      ],
      metric: 'points',
    },
    Component: lazy('Dash 2048', () => import('./engines/Dash2048')),
  },
  'sky-hop': {
    meta: {
      key: 'sky-hop',
      name: 'Sky Hop Engine',
      blurb: 'One-button endless flyer with parallax skylines and a steadily rising difficulty curve.',
      controls: [
        { keys: 'Space / click', action: 'Flap' },
        { keys: 'Tap', action: 'Flap on touch' },
      ],
      metric: 'towers',
    },
    Component: lazy('Sky Hop', () => import('./engines/SkyHop')),
  },
};

export function getEngine(key: string | null | undefined) {
  if (!key) return null;
  return ENGINES[key] ?? null;
}

export const ENGINE_KEYS = Object.keys(ENGINES);
