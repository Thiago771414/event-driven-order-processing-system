import { randomUUID } from 'crypto';

export function getCorrelationId(incoming?: string | string[]) {
  const v = Array.isArray(incoming) ? incoming[0] : incoming;
  return v?.trim() ? v : randomUUID();
}
