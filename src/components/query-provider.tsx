'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ChildrenProps } from '../types/ui';

export function QueryProvider({ children }: ChildrenProps) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 500, retry: 1 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
