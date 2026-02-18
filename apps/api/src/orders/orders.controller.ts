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
  async getById(@Param('id') id: string) {
    const { rows } = await this.db.pool.query(
      `SELECT id, customer_id, total, status, correlation_id, created_at FROM orders WHERE id = $1`,
      [id],
    );

    if (!rows[0]) throw new NotFoundException('Order not found');
    return rows[0];
  }
}
