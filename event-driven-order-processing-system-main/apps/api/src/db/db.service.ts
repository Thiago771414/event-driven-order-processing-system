import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  readonly pool: Pool;

  constructor() {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        'Missing required environment variable POSTGRES_URL. Create a repository-root .env from .env.example for local development.',
      );
    }

    this.pool = new Pool({ connectionString });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
