import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../src/components/api-client';

afterEach(() => vi.unstubAllGlobals());

describe('API client failure boundaries', () => {
  it('reports an HTML service failure without a JSON parse error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<h1>Offline</h1>', {
          status: 503,
        }),
      ),
    );
    await expect(request('/api/reservations')).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('rejects malformed success responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
    await expect(request('/api/reservations')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('preserves validation evidence with a localizable error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: 'Validation failed.',
            issues: [{ message: 'Invalid email address' }],
          },
          { status: 400 },
        ),
      ),
    );
    await expect(request('/api/simulations', {})).rejects.toMatchObject({
      code: 'validation',
      message: 'Invalid email address',
    });
  });

  it('distinguishes network failures from intentional query cancellation', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const abort = new DOMException('Cancelled', 'AbortError');
    fetch.mockRejectedValueOnce(abort);
    vi.stubGlobal('fetch', fetch);
    await expect(request('/api/reservations')).rejects.toMatchObject({ code: 'network' });
    await expect(request('/api/reservations')).rejects.toBe(abort);
  });

  it('preserves cancellation while the response body is being read', async () => {
    const abort = new DOMException('Cancelled', 'AbortError');
    const response = new Response('{}');
    vi.spyOn(response, 'json').mockRejectedValue(abort);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(request('/api/reservations')).rejects.toBe(abort);
  });
});
