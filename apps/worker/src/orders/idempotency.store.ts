import { Injectable } from '@nestjs/common';

type Entry = { value: unknown; expiresAt: number };

@Injectable()
export class IdempotencyStore {
  private readonly map = new Map<string, Entry>();

  /**
   * TTL default: 10 min
   */
  get(key: string) {
    const e = this.map.get(key);
    if (!e) return undefined;

    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: unknown, ttlMs = 10 * 60 * 1000) {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
