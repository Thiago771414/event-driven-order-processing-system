import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderId,
} from '../types/order';
import { apiRequest } from './apiClient';

export interface CreateOrderOptions {
  correlationId?: string;
  idempotencyKey: string;
}

export const orderService = {
  async createOrder(
    input: CreateOrderRequest,
    options: CreateOrderOptions,
  ): Promise<CreateOrderResponse> {
    return apiRequest<CreateOrderResponse, CreateOrderRequest>('/orders', {
      method: 'POST',
      body: input,
      context: {
        correlationId: options.correlationId,
        idempotencyKey: options.idempotencyKey,
      },
      // Writes are retried only when the API contract is explicitly idempotent.
      retry: {
        attempts: 1,
        retryOnMethods: ['POST'],
      },
    });
  },

  async getOrderById(orderId: OrderId): Promise<Order> {
    return apiRequest<Order>(`/orders/${orderId}`, {
      method: 'GET',
      retry: {
        attempts: 2,
      },
    });
  },
};
