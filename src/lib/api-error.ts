import type { ApiErrorCode } from '../types/http';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    detail?: string,
  ) {
    super(detail ?? code);
    this.name = 'ApiError';
  }
}
