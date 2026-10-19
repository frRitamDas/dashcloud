import { z } from 'zod';

export const scoreSubmissionSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  score: z.number().int().min(0).max(100_000_000),
  metric: z.string().trim().min(1).max(30).default('points'),
  payload: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  guestName: z.string().trim().min(2).max(24).optional(),
});

export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;
