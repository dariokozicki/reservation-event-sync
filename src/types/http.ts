export type ApiErrorCode =
  'network' | 'validation' | 'conflict' | 'unavailable' | 'invalid_response' | 'request';

export type ErrorNoticeProps = { error: Error; onRetry?: () => void };
