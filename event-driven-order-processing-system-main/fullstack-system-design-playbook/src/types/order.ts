import type { ProductId } from './product';

export type OrderId = string;
export type CustomerId = string;

export type OrderStatus =
  | 'PEDIDO_PENDENTE'
  | 'PEDIDO_CONFIRMADO'
  | 'PEDIDO_CANCELADO';

export type PaymentStatus =
  | 'PAGAMENTO_PENDENTE'
  | 'PAGAMENTO_PENDENTE_VERIFICACAO'
  | 'PAGAMENTO_CONFIRMADO'
  | 'PAGAMENTO_FALHOU'
  | 'RECONCILIACAO_NECESSARIA';

export type GatewayBehavior = 'confirmed' | 'failed' | 'unknown' | 'timeout';

export interface OrderItem {
  productId: ProductId;
  qty: number;
  price: number;
}

export interface CheckoutPaymentInput {
  method: 'card' | string;
  token?: string;
  gatewayBehavior?: GatewayBehavior;
}

export interface CreateOrderRequest {
  customerId: CustomerId;
  items: OrderItem[];
  payment?: CheckoutPaymentInput;
}

export interface CreateOrderResponse {
  orderId: OrderId;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  gatewayTransactionReference: string | null;
  total: number;
}

export interface Order {
  id: OrderId;
  customerId: CustomerId;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  gatewayTransactionReference: string | null;
  correlationId: string;
  createdAt: string;
  items?: OrderItem[];
}

export type OrderLifecycleStage =
  | 'idle'
  | 'editing_cart'
  | 'submitting'
  | 'accepted_by_api'
  | 'pending_async_processing'
  | 'confirmed'
  | 'failed'
  | 'needs_reconciliation';

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  'PEDIDO_CONFIRMADO',
  'PEDIDO_CANCELADO',
];
