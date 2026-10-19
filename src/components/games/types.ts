export type Quality = 'low' | 'medium' | 'high';

export interface EngineProps {
  /** Report a finished run so the platform can persist it to the leaderboard. */
  onScore: (score: number, metric?: string, payload?: Record<string, string | number | boolean>) => void;
  /** Live telemetry shown in the session HUD. */
  onTelemetry?: (data: { fps?: number; detail?: string }) => void;
  paused: boolean;
  quality: Quality;
  muted: boolean;
  accent: string;
  playerName: string;
}

export interface EngineMeta {
  key: string;
  name: string;
  blurb: string;
  controls: { keys: string; action: string }[];
  metric: string;
  heavy?: boolean;
}
