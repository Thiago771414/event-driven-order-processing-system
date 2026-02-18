import { Injectable } from '@nestjs/common';

/**
 * In-memory. Depois a gente troca por Redis/Postgres.
 */
@Injectable()
export class IdempotencyStore {
  private map = new Map<string, any>();

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: any) {
    this.map.set(key, value);
  }
}
