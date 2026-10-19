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
