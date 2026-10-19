import { supportTicketSchema } from '@/features/support/contracts';
import { createSupportTicket } from '@/features/support/service';
import { fail, json, readJson, withPublicRateLimit } from '@/lib/api';

export const dynamic = 'force-dynamic';

const limit = withPublicRateLimit('ticket', 4, 10 * 60_000);

export async function POST(req: Request) {
  const rate = limit(req);
  if (!rate.ok) {
    return fail('You have opened too many tickets. Please wait a few minutes.', 429, {
      retryAfter: rate.retryAfter,
    });
  }

  const parsed = supportTicketSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('Please check the ticket details and try again.', 422, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const ticket = await createSupportTicket(parsed.data);
    return json({ ok: true, ticket }, { status: 201 });
  } catch {
    return fail('We could not open your ticket right now. Please try again.', 503);
  }
}
