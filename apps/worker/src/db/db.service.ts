import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  async onModuleDestroy() {
    await this.pool.end();
  }
}
