import { getAdminOverview } from '@/lib/admin-overview';
import { json, withAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAdmin('GET', async () => json(await getAdminOverview()));
