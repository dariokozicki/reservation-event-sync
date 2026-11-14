'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReservationDetail } from '../types/api';
import type { ReservationAction } from '../types/ui';
import { request } from './api-client';

export function useReservation(id: string | null) {
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ['reservation', id],
    queryFn: ({ signal }) =>
      request<ReservationDetail>(`/api/reservations/${id}`, undefined, signal),
    enabled: !!id,
    refetchInterval: 1000,
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['reservations'] }),
      client.invalidateQueries({ queryKey: ['reservation'] }),
    ]);
  };
  const action = useMutation({
    mutationFn: (input: ReservationAction) => request(`/api/reservations/${id}/actions`, input),
    onSuccess: refresh,
  });
  return { detail, action, refresh };
}
