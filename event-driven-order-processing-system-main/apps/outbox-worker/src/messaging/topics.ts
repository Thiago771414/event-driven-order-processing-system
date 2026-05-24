export const TOPICS = {
  ORDERS_CREATED: 'orders.created',
  ORDERS_PROCESSED: 'orders.processed',
  ORDERS_CREATED_DLQ: 'orders.created.dlq',
  PAYMENT_VERIFICATION_REQUESTED: 'payments.verification.requested',
  PAYMENT_CONFIRMED: 'payments.confirmed',
  PAYMENT_FAILED: 'payments.failed',
  PAYMENT_RECONCILIATION_NEEDED: 'payments.reconciliation.needed',
} as const;
