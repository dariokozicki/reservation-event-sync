import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { db } from '../../../db/client';
import { streams } from '../../../db/schema';
import { ReservationPage } from '../../../components/reservation-page';
import type { RouteContext } from '../../../types/api';

export const dynamic = 'force-dynamic';

export default async function ReservationRoute({ params }: RouteContext) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [reservation] = await db.select({ id: streams.id }).from(streams).where(eq(streams.id, id));
  if (!reservation) notFound();
  return <ReservationPage key={id} id={id} />;
}
