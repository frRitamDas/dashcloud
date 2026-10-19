import { z } from 'zod';

export const gameSortSchema = z.enum(['popular', 'rating', 'newest', 'az']).default('popular');
export const gameModeSchema = z.enum(['native', 'cloud']);

export const gameListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  genre: z.string().trim().max(40).optional(),
  mode: gameModeSchema.optional(),
  sort: gameSortSchema,
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export type GameListQuery = z.infer<typeof gameListQuerySchema>;

export const scoreSubmissionSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  score: z.number().int().min(0).max(100_000_000),
  metric: z.string().trim().min(1).max(30).default('points'),
  payload: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  guestName: z.string().trim().min(2).max(24).optional(),
});

export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;
