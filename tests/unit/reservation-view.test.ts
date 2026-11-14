import { describe, expect, it } from 'vitest';
import { buildScenario } from '../../src/domain/scenarios';
import { synchronizationStatus } from '../../src/lib/reservation-view';

describe('reservation synchronization presentation', () => {
  it('never treats an absent source as a match', () => {
    expect(synchronizationStatus({ source: null, local: null })).toBe('unavailable');
  });

  it('detects divergent fields even when versions match', () => {
    const source = buildScenario('standard').source!;
    const local = { ...source, guests: source.guests + 1 };
    expect(synchronizationStatus({ source, local })).toBe('diverged');
    expect(synchronizationStatus({ source, local: { ...source } })).toBe('synced');
  });

  it('prioritizes blocked and buffered events over snapshot equality', () => {
    const source = buildScenario('standard').source!;
    const view = { source, local: source };
    expect(synchronizationStatus({ ...view, inbox: [{ state: 'blocked' }] })).toBe('blocked');
    expect(synchronizationStatus({ ...view, inbox: [{ state: 'buffered' }] })).toBe('waiting');
  });
});
