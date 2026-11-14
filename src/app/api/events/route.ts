import { api, assertSameOrigin, readJson } from '../../../server/http';
import { ingest } from '../../../server/sync';

export async function POST(request: Request) {
  return api(async () => {
    assertSameOrigin(request);
    const result = await ingest(await readJson(request));
    const status = result.outcome === 'conflict' ? 409 : result.outcome === 'blocked' ? 422 : 200;
    return Response.json(result, { status });
  });
}
