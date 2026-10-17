/** Client-safe shapes for the admin control plane payloads. */

export type ServiceStatusRow = {
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
};

export type Kpis = {
  users: number;
  newUsers7d: number;
  games: number;
  gamesPublished: number;
  gamesNative: number;
  activeSessions: number;
  sessions24h: number;
  scores: number;
  openTickets: number;
  playtimeHours7d: number;
  avgLatency: number;
  healthyServices: number;
  totalServices: number;
};

export type AdminSessionRow = {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  region: string | null;
  status: 'booting' | 'streaming' | 'ended' | 'failed';
  resolution: string | null;
  latency_ms: number | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  games?: { title: string; slug: string; accent: string; genre?: string } | null;
  profiles?: { username: string | null; display_name: string | null; level?: number } | null;
};

export type ActivityRow = {
  id: number;
  actor: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string | null;
  kind: 'info' | 'success' | 'warning' | 'danger';
  link: string | null;
  active: boolean;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: Record<string, unknown>;
  is_public: boolean;
  updated_at: string;
};

export type AdminGameRow = {
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
  play_mode: 'native' | 'cloud';
  engine_key: string | null;
  stream_url: string | null;
  cloud_tier: 'standard' | 'premium' | 'ultra';
  requirements: Record<string, string>;
  status: 'live' | 'queue' | 'maintenance' | 'soon';
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ScoreRowAdmin = {
  id: string;
  score: number;
  metric: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  games?: { title: string; slug: string; accent: string } | null;
  profiles?: { username: string | null; display_name: string | null; level: number } | null;
};

export type ProfileRowAdmin = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  xp: number;
  level: number;
  coins: number;
  total_play_seconds: number;
  games_played: number;
  is_pro: boolean;
  is_banned: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export type TicketRow = {
  id: string;
  reference: string | null;
  name: string;
  email: string;
  subject: string;
  body: string;
  category: 'technical' | 'account' | 'billing' | 'report' | 'other';
  priority: 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reply: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type OverviewData = {
  kpis: Kpis;
  status: ServiceStatusRow[];
  recentSessions: AdminSessionRow[];
  activity: ActivityRow[];
  announcements: AnnouncementRow[];
  settings: SettingRow[];
  sparkline: { label: string; value: number }[];
  games?: { id: string; slug: string; title: string; accent: string; status: string; play_mode: string }[];
};
