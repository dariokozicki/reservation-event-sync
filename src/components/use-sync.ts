'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { Overview } from '../types/api';
import type { SimulationInput } from '../types/ui';
import { request } from './api-client';
import { useReservation } from './use-reservation';

export function useSync(selected: string | null, select: (id: string) => void) {
  const overview = useQuery({
    queryKey: ['reservations'],
    queryFn: ({ signal }) => request<Overview>('/api/reservations', undefined, signal),
    refetchInterval: 1500,
  });
  const id = selected ?? overview.data?.reservations[0]?.id ?? null;
  const reservation = useReservation(id);
  const simulate = useMutation({
    mutationFn: (input: SimulationInput) => request<{ id: string }>('/api/simulations', input),
    onSuccess: async (result) => {
      select(result.id);
      await reservation.refresh();
    },
  });
  return { overview, simulate, id, ...reservation };
}
