import { api } from '../../../server/http';
import { overview } from '../../../server/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  return api(async () => Response.json(await overview()));
}
