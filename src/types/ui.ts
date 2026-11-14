import type { EventChange, FaultMode, Reservation, ReservationDetails, Scenario } from './domain';
import type { ReactNode } from 'react';
import type { ReservationDetail, StreamSummary } from './api';

export type ReservationAction =
  | { action: 'deliver'; eventId: string }
  | { action: 'append'; change: EventChange }
  | { action: 'fault'; fault: FaultMode }
  | { action: 'retry' };

export type ActionHandler = (action: ReservationAction) => void;
export type SimulationInput = { scenario: Scenario; details?: ReservationDetails };

export type DemoScenario = Exclude<Scenario, 'manual'>;
export type BadgeProps = { value: string };
export type SyncView = {
  source: Reservation | null;
  local: Reservation | null;
  inbox?: { state: string }[];
};

export type InspectorProps = {
  data: ReservationDetail;
  pending: boolean;
  onAction: ActionHandler;
  tab?: InspectorTab;
  onTabChange?: (tab: InspectorTab) => void;
  standalone?: boolean;
};

export type InspectorTab = 'events' | 'state' | 'email';
export type ChildrenProps = { children: ReactNode };
export type ReservationPageProps = { id: string };
export type ReservationSummaryProps = { data: ReservationDetail };
export type RouteErrorProps = { error: Error & { digest?: string }; reset: () => void };
export type RouteMessageProps = {
  state: 'missing' | 'loading' | 'unavailable';
  reset?: () => void;
};

export type SimulatorProps = {
  pending: boolean;
  onRun: (input: SimulationInput) => void;
};

export type ReservationListProps = {
  reservations: StreamSummary[];
  selected: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
};
