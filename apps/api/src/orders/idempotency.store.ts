import { Injectable } from '@nestjs/common';

export type IdempotencyValue = {
  processedAt: string;
  orderId: string;
};

/**
 * In-memory. Depois a gente troca por Redis/Postgres.
 */
@Injectable()
export class IdempotencyStore {
  private readonly map = new Map<string, IdempotencyValue>();

  get(key: string): IdempotencyValue | undefined {
    return this.map.get(key);
  }

  set(key: string, value: IdempotencyValue): void {
    this.map.set(key, value);
  }
}
