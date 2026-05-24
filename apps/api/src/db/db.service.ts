import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  readonly pool: Pool;

  constructor() {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL is not set in .env');
    }

    this.pool = new Pool({ connectionString });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
