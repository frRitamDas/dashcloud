import { z } from 'zod';

export const sessionStartSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  region: z.string().trim().max(40).optional(),
  resolution: z.string().trim().max(20).optional(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  guestId: z.string().trim().min(6).max(80).optional(),
});

export const sessionEndSchema = z.object({
  sessionId: z.string().uuid(),
  guestId: z.string().trim().min(6).max(80).optional(),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 8),
  status: z.enum(['ended', 'failed']).default('ended'),
});

export const sessionStreamingSchema = z.object({
  sessionId: z.string().uuid(),
  guestId: z.string().trim().min(6).max(80).optional(),
  latencyMs: z.number().int().min(0).max(900).optional(),
  resolution: z.string().trim().max(20).optional(),
  region: z.string().trim().max(40).optional(),
});

export type SessionStartInput = z.infer<typeof sessionStartSchema>;
export type SessionEndInput = z.infer<typeof sessionEndSchema>;
export type SessionStreamingInput = z.infer<typeof sessionStreamingSchema>;
