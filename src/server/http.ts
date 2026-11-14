import { ZodError, z } from 'zod';
import { DomainError } from '../domain/reservation';

export async function readJson(request: Request): Promise<unknown> {
  // Bound actual body bytes, not just the optional client-supplied content-length header.
  const reader = request.body?.getReader();
  if (!reader) throw new DomainError('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 32_768) {
      await reader.cancel();
      throw new DomainError('Request body exceeds 32 KB.');
    }
    chunks.push(chunk.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new DomainError('Request body must be valid JSON.');
  }
}

export function validateId(id: string) {
  return z.uuid().parse(id);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  const host = request.headers.get('host');
  if (origin && origin !== expected && new URL(origin).host !== host) {
    throw new DomainError('Cross-origin mutations are not allowed.');
  }
}

export async function api(action: () => Promise<Response>): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: 'Validation failed.', issues: error.issues }, { status: 400 });
    }
    if (error instanceof DomainError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    console.error(error);
    return Response.json({ error: 'Request failed. Check the service logs.' }, { status: 500 });
  }
}
