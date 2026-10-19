import { z } from 'zod';

export const supportTicketSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  subject: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(4000),
  category: z.enum(['technical', 'account', 'billing', 'report', 'other']).default('technical'),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
