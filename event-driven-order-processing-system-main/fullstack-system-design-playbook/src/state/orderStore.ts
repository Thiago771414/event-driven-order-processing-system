import type {
  CreateOrderResponse,
  Order,
  OrderId,
  OrderLifecycleStage,
} from '../types/order';

export interface OrderLifecycleState {
  currentOrderId?: OrderId;
  currentOrder?: Order;
  stage: OrderLifecycleStage;
  isLoading: boolean;
  error?: string;
  lastUpdatedAt?: string;
}

type OrderListener = () => void;

const initialState: OrderLifecycleState = {
  stage: 'idle',
  isLoading: false,
};

let orderState: OrderLifecycleState = initialState;
const listeners = new Set<OrderListener>();

export const orderStore = {
  getSnapshot() {
    return orderState;
  },

  subscribe(listener: OrderListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  markSubmitting() {
    updateOrderState({
      ...orderState,
      stage: 'submitting',
      isLoading: true,
      error: undefined,
    });
  },

  receiveCreatedOrder(response: CreateOrderResponse) {
    updateOrderState({
      currentOrderId: response.orderId,
      stage: mapCreateResponseToStage(response),
      isLoading: false,
      error: undefined,
    });
  },

  receiveOrder(order: Order) {
    updateOrderState({
      currentOrderId: order.id,
      currentOrder: order,
      stage: mapOrderToStage(order),
      isLoading: false,
      error: undefined,
    });
  },

  markRefreshing() {
    updateOrderState({
      ...orderState,
      isLoading: true,
      error: undefined,
    });
  },

  markError(error: string) {
    updateOrderState({
      ...orderState,
      isLoading: false,
      error,
    });
  },

  reset() {
    updateOrderState(initialState);
  },
};

function mapCreateResponseToStage(
  response: CreateOrderResponse,
): OrderLifecycleStage {
  if (response.status === 'PEDIDO_CONFIRMADO') return 'confirmed';
  if (response.status === 'PEDIDO_CANCELADO') return 'failed';
  return 'accepted_by_api';
}

function mapOrderToStage(order: Order): OrderLifecycleStage {
  if (order.paymentStatus === 'RECONCILIACAO_NECESSARIA') {
    return 'needs_reconciliation';
  }

  if (order.status === 'PEDIDO_CONFIRMADO') return 'confirmed';
  if (order.status === 'PEDIDO_CANCELADO') return 'failed';
  return 'pending_async_processing';
}

function updateOrderState(nextState: OrderLifecycleState) {
  // This is a client-side view of an async backend workflow. PostgreSQL remains
  // the source of truth; the store only reflects the latest known API response.
  orderState = {
    ...nextState,
    lastUpdatedAt: new Date().toISOString(),
  };

  listeners.forEach((listener) => listener());
}
