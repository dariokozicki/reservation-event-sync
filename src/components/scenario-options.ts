import type { DemoScenario } from '../types/ui';

export const scenarioIds = [
  'standard',
  'duplicates',
  'reordered',
  'gap',
  'email_retry',
  'cancelled',
  'unconfirmed_cancelled',
] as const satisfies readonly DemoScenario[];

export function isDemoScenario(value: string): value is DemoScenario {
  return scenarioIds.some((id) => id === value);
}
