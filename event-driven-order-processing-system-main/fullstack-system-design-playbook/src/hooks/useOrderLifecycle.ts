import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { orderService } from '../services/orderService';
import { orderStore } from '../state/orderStore';
import type { CreateOrderRequest, OrderId } from '../types/order';

export function useOrderLifecycle() {
  const orderLifecycle = useSyncExternalStore(
    orderStore.subscribe,
    orderStore.getSnapshot,
    orderStore.getSnapshot,
  );

  const submitOrder = useCallback(async (input: CreateOrderRequest) => {
    orderStore.markSubmitting();

    try {
      const response = await orderService.createOrder(input, {
        idempotencyKey: createIdempotencyKey(),
      });
      orderStore.receiveCreatedOrder(response);
      return response;
    } catch (error) {
      orderStore.markError(getErrorMessage(error));
      throw error;
    }
  }, []);

  const refreshOrder = useCallback(async (orderId: OrderId) => {
    orderStore.markRefreshing();

    try {
      const order = await orderService.getOrderById(orderId);
      orderStore.receiveOrder(order);
      return order;
    } catch (error) {
      orderStore.markError(getErrorMessage(error));
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      orderLifecycle,
      actions: {
        submitOrder,
        refreshOrder,
        reset: orderStore.reset,
      },
    }),
    [orderLifecycle, refreshOrder, submitOrder],
  );
}

function createIdempotencyKey() {
  if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected request failure';
}
