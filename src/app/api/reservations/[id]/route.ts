import { api, validateId } from '../../../../server/http';
import { detail } from '../../../../server/queries';
import type { RouteContext } from '../../../../types/api';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext) {
  return api(async () => {
    const id = validateId((await context.params).id);
    const reservation = await detail(id);
    return reservation
      ? Response.json(reservation)
      : Response.json({ error: 'Reservation not found.' }, { status: 404 });
  });
}
