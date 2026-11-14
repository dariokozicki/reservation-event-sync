'use client';

import { RouteMessage } from '../../../components/route-message';
import type { RouteErrorProps } from '../../../types/ui';

export default function ErrorPage({ reset }: RouteErrorProps) {
  return <RouteMessage state="unavailable" reset={reset} />;
}
