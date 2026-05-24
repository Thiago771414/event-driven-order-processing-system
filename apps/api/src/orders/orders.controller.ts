import {
  Body,
  Controller,
  Headers,
  Post,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrdersService } from './orders.service';
import { DbService } from '../db/db.service';

type OrderRow = {
  id: string;
  customer_id: string;
  total: number | string; // pg pode devolver string dependendo do tipo
  status: string;
  correlation_id: string;
  created_at: string; // normalmente vem string
};

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly db: DbService,
  ) {}

  @Post()
  create(
    @Body() body: unknown,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.createOrder(body, {
      correlationId: correlationId ?? randomUUID(),
      idempotencyKey: idempotencyKey ?? randomUUID(),
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<{
    id: string;
    customerId: string;
    total: number;
    status: string;
    correlationId: string;
    createdAt: string;
  }> {
    const result = await this.db.pool.query<OrderRow>(
      `SELECT id, customer_id, total, status, correlation_id, created_at FROM orders WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException('Order not found');

    return {
      id: row.id,
      customerId: row.customer_id,
      total: Number(row.total),
      status: row.status,
      correlationId: row.correlation_id,
      createdAt: row.created_at,
    };
  }
}
