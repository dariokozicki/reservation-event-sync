import { z } from 'zod';
import { faultSchema } from '../../../../../domain/schemas';
import { api, assertSameOrigin, readJson, validateId } from '../../../../../server/http';
import {
  appendSourceEvent,
  deliverSourceEvent,
  retryEmail,
  setProviderFault,
} from '../../../../../server/simulator';
import type { RouteContext } from '../../../../../types/api';

const actionSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('deliver'), eventId: z.uuid() }),
  z.strictObject({ action: z.literal('append'), change: z.unknown() }),
  z.strictObject({ action: z.literal('fault'), fault: faultSchema }),
  z.strictObject({ action: z.literal('retry') }),
]);

export async function POST(request: Request, context: RouteContext) {
  return api(async () => {
    assertSameOrigin(request);
    const id = validateId((await context.params).id);
    const body = actionSchema.parse(await readJson(request));
    switch (body.action) {
      case 'deliver':
        return Response.json(await deliverSourceEvent(id, body.eventId));
      case 'append':
        return Response.json(await appendSourceEvent(id, body.change));
      case 'fault':
        await setProviderFault(id, body.fault);
        return Response.json({ ok: true });
      case 'retry':
        return Response.json(await retryEmail(id));
    }
  });
}
