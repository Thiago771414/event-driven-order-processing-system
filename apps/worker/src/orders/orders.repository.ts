import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: DbService) {}

  async markProcessed(orderId: string) {
    await this.db.pool.query(
      `
      UPDATE orders
      SET status = 'processed',
          processed_at = now(),
          last_error = NULL
      WHERE id = $1
        AND status <> 'processed'
      `,
      [orderId],
    );
  }

  async markFailed(orderId: string, error: string) {
    await this.db.pool.query(
      `
      UPDATE orders
      SET last_error = $2
      WHERE id = $1
        AND status <> 'processed'
      `,
      [orderId, error],
    );
  }
}
