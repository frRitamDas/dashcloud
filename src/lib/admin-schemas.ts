import { z } from 'zod';

export const gameUpsertSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase hyphenated slug only'),
  title: z.string().min(2).max(120),
  tagline: z.string().max(200).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  genre: z.string().min(2).max(40),
  tags: z.array(z.string().max(30)).max(12).optional(),
  publisher: z.string().max(120).nullable().optional(),
  release_year: z.number().int().min(1970).max(2100).nullable().optional(),
  cover_url: z.string().url().max(600).nullable().optional().or(z.literal('')),
  banner_url: z.string().url().max(600).nullable().optional().or(z.literal('')),
  screenshots: z.array(z.string().url().max(600)).max(12).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #rrggbb hex colour'),
  rating: z.number().min(0).max(5),
  players_online: z.number().int().min(0).max(100_000_000),
  play_mode: z.enum(['native', 'cloud']),
  engine_key: z.string().max(60).nullable().optional(),
  stream_url: z.string().url().max(600).nullable().optional().or(z.literal('')),
  cloud_tier: z.enum(['standard', 'premium', 'ultra']),
  requirements: z.record(z.string().max(120)).optional(),
  status: z.enum(['live', 'queue', 'maintenance', 'soon']),
  featured: z.boolean(),
  published: z.boolean(),
  sort_order: z.number().int().min(-1000).max(100000),
});

export const statusPatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['operational', 'degraded', 'partial', 'down', 'maintenance']).optional(),
  load_percent: z.number().int().min(0).max(100).optional(),
  latency_ms: z.number().int().min(0).max(5000).optional(),
  message: z.string().max(280).nullable().optional(),
  gpu_pool: z.string().max(80).nullable().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().max(600).nullable().optional(),
  kind: z.enum(['info', 'success', 'warning', 'danger']),
  active: z.boolean(),
  link: z.string().max(200).nullable().optional(),
});

export const settingsSchema = z.object({
  key: z.string().min(2).max(40),
  value: z.record(z.unknown()),
  is_public: z.boolean().optional(),
});

export const userPatchSchema = z.object({
  id: z.string().uuid(),
  is_banned: z.boolean().optional(),
  is_pro: z.boolean().optional(),
  coins: z.number().int().min(0).max(100_000_000).optional(),
  xp: z.number().int().min(0).max(100_000_000).optional(),
  display_name: z.string().max(60).optional(),
});

export const ticketPatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['normal', 'high', 'urgent']).optional(),
  category: z.enum(['technical', 'account', 'billing', 'report', 'other']).optional(),
  reply: z.string().max(4000).nullable().optional(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(4).max(200),
  newPassword: z.string().min(8).max(200).regex(/[A-Za-z]/).regex(/[0-9]/, 'Must contain a number'),
});
