import { describe, expect, it } from 'vitest';
import { POST } from '../../src/app/api/events/route';
import { GET } from '../../src/app/api/reservations/[id]/route';
import { buildScenario } from '../../src/domain/scenarios';
import { setupDatabase } from './setup';

setupDatabase();

function request(body: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

describe('HTTP contract', () => {
  it('returns 400 for an invalid event and never accepts unknown fields', async () => {
    expect((await POST(request({ type: 'created' }))).status).toBe(400);
    const event = buildScenario('standard').events[0];
    expect((await POST(request({ ...event, extra: 'unexpected' }))).status).toBe(400);
  });

  it('rejects malformed JSON and oversized request bodies', async () => {
    const malformed = new Request('http://localhost:3000/api/events', {
      method: 'POST',
      body: '{',
    });
    expect((await POST(malformed)).status).toBe(422);
    expect((await POST(request({ data: 'a'.repeat(33_000) }))).status).toBe(422);
  });

  it('rejects browser mutations from another origin', async () => {
    const event = buildScenario('standard').events[0];
    expect((await POST(request(event, 'https://unrelated.example'))).status).toBe(422);
  });

  it('acknowledges identical duplicates and returns 409 for conflicts', async () => {
    const event = buildScenario('standard').events[0];
    expect((await POST(request(event))).status).toBe(200);
    const duplicate = await POST(request(event));
    expect(duplicate.status).toBe(200);
    expect((await duplicate.json()).outcome).toBe('duplicate');
    const conflict = await POST(request({ ...event, occurredAt: '2026-01-01T00:00:00Z' }));
    expect(conflict.status).toBe(409);
  });

  it('returns useful errors for invalid and unknown reservation IDs', async () => {
    const req = new Request('http://localhost:3000/api/reservations/example');
    expect((await GET(req, { params: Promise.resolve({ id: 'not-a-uuid' }) })).status).toBe(400);
    expect((await GET(req, { params: Promise.resolve({ id: crypto.randomUUID() }) })).status).toBe(
      404,
    );
  });
});
