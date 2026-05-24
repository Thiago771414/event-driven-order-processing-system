export const ORDER_STATUS = {
  PENDING: 'PEDIDO_PENDENTE',
  CONFIRMED: 'PEDIDO_CONFIRMADO',
  CANCELED: 'PEDIDO_CANCELADO',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
