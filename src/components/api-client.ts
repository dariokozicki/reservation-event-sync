import { z } from 'zod';
import { ApiError } from '../lib/api-error';
import type { ApiErrorCode } from '../types/http';

const statusCodes: Partial<Record<number, ApiErrorCode>> = {
  400: 'validation',
  409: 'conflict',
  422: 'validation',
};

const errorResponse = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  issues: z.array(z.object({ message: z.string() })).optional(),
});

export async function request<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      ...(body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('network');
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
  }
  if (!response.ok) {
    const parsed = errorResponse.safeParse(data);
    const details = parsed.success ? parsed.data : undefined;
    const code =
      response.status >= 500 ? 'unavailable' : (statusCodes[response.status] ?? 'request');
    throw new ApiError(code, details?.issues?.[0]?.message ?? details?.error ?? details?.message);
  }
  if (data === undefined) throw new ApiError('invalid_response');
  return data as T;
}
