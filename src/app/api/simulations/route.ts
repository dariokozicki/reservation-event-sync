import { api, assertSameOrigin, readJson } from '../../../server/http';
import { simulate } from '../../../server/simulator';

export async function POST(request: Request) {
  return api(async () => {
    assertSameOrigin(request);
    return Response.json(await simulate(await readJson(request)), { status: 201 });
  });
}
