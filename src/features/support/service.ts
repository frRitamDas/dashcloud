import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { SupportTicketInput } from './contracts';

export async function createSupportTicket(input: SupportTicketInput) {
  const { data, error } = await supabaseAdmin()
    .from('tickets')
    .insert({ ...input, status: 'open', priority: 'normal' })
    .select('id,reference,created_at')
    .single();

  if (error) {
    // Keep database internals out of public API responses.
    console.error('[support:create-ticket]', error.code, error.message);
    throw new Error('Could not create your support ticket');
  }

  return data;
}
