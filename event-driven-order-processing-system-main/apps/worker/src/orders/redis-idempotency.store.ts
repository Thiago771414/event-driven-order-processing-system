import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisIdempotencyStore implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error(
        'Missing required environment variable REDIS_URL. Set REDIS_URL=redis://localhost:6379 in the repository-root .env.',
      );
    }

    this.redis = new Redis(redisUrl);
  }

  async tryAcquire(
    key: string,
    ttlMs = 10 * 60 * 1000,
  ): Promise<boolean> {
    const res = await this.redis.set(key, '1', 'PX', ttlMs, 'NX');
    return res === 'OK';
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
