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
  payment_status: string | null;
  gateway_transaction_reference: string | null;
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
    paymentStatus: string | null;
    gatewayTransactionReference: string | null;
    correlationId: string;
    createdAt: string;
  }> {
    const result = await this.db.pool.query<OrderRow>(
      `
      SELECT
        o.id,
        o.customer_id,
        o.total,
        o.status,
        p.status AS payment_status,
        p.gateway_transaction_reference,
        o.correlation_id,
        o.created_at
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = $1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) throw new NotFoundException('Order not found');

    return {
      id: row.id,
      customerId: row.customer_id,
      total: Number(row.total),
      status: row.status,
      paymentStatus: row.payment_status,
      gatewayTransactionReference: row.gateway_transaction_reference,
      correlationId: row.correlation_id,
      createdAt: row.created_at,
    };
  }
}
