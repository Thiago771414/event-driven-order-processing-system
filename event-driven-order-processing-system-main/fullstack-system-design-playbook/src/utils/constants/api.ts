export const API_BASE_URL =
  import.meta.env.VITE_MINISHOP_API_URL ?? 'http://localhost:3000';

export const DEFAULT_TIMEOUT_MS = 10_000;

export const HTTP_HEADERS = {
  authorization: 'Authorization',
  contentType: 'Content-Type',
  correlationId: 'X-Correlation-Id',
  idempotencyKey: 'X-Idempotency-Key',
  requestId: 'X-Request-Id',
  traceParent: 'traceparent',
} as const;

export const JSON_CONTENT_TYPE = 'application/json';
