export type GameStatus = 'live' | 'queue' | 'maintenance' | 'soon';
export type PlayMode = 'native' | 'cloud';

export interface Game {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  genre: string;
  tags: string[];
  publisher: string | null;
  release_year: number | null;
  cover_url: string | null;
  banner_url: string | null;
  screenshots: string[];
  accent: string;
  rating: number;
  players_online: number;
  play_mode: PlayMode;
  engine_key: string | null;
  stream_url: string | null;
  cloud_tier: string;
  requirements: Record<string, string>;
  status: GameStatus;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  xp: number;
  level: number;
  coins: number;
  total_play_seconds: number;
  games_played: number;
  is_pro: boolean;
  is_banned: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface ServiceStatus {
  id: string;
  region: string;
  region_code: string;
  service: string;
  status: 'operational' | 'degraded' | 'partial' | 'down' | 'maintenance';
  load_percent: number;
  latency_ms: number;
  gpu_pool: string | null;
  message: string | null;
  sort_order: number;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  kind: 'info' | 'success' | 'warning' | 'danger';
  active: boolean;
  link: string | null;
  created_at: string;
}

export interface ScoreRow {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  game_id: string;
  score: number;
  metric: string;
  payload: Record<string, unknown>;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'level'> | null;
  games?: Pick<Game, 'slug' | 'title' | 'accent'> | null;
}

export interface GameSession {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  game_id: string;
  region: string | null;
  status: 'booting' | 'streaming' | 'ended' | 'failed';
  resolution: string | null;
  latency_ms: number | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  games?: Pick<Game, 'title' | 'slug' | 'accent'> | null;
  profiles?: Pick<Profile, 'username' | 'display_name' | 'level'> | null;
}

export interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  category: 'technical' | 'account' | 'billing' | 'report' | 'other';
  priority: 'normal' | 'high' | 'urgent';
  reference: string | null;
  reply: string | null;
  resolved_at: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export interface ActivityEntry {
  id: number;
  actor: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface AdminRow {
  id: string;
  username: string;
  email: string | null;
  role: 'owner' | 'admin' | 'moderator';
  active: boolean;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
}

export interface SiteSettings {
  name: string;
  fullName: string;
  tagline: string;
  description: string;
  supportEmail: string;
  credits: string;
}

export interface StatsSettings {
  totalPlayers: number;
  gamesHosted: number;
  countries: number;
  avgBootSeconds: number;
  uptimePercent: number;
}

export interface LiveStats {
  playersOnline: number;
  activeSessions: number;
  gamesLive: number;
  avgLatency: number;
  queueLength: number;
  uptime: number;
  degraded: number;
}
