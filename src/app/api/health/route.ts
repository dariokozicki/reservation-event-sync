import { sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { api } from '../../../server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return api(async () => {
    await db.execute(sql`select 1`);
    return Response.json({ status: 'ok' });
  });
}
