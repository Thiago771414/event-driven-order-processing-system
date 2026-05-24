import { Injectable } from '@nestjs/common';

type Entry = { value: Record<string, unknown>; expiresAt: number };

@Injectable()
export class IdempotencyStore {
  private readonly map = new Map<string, Entry>();

  get(key: string): Record<string, unknown> | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;

    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(
    key: string,
    value: Record<string, unknown>,
    ttlMs = 10 * 60 * 1000,
  ): void {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
