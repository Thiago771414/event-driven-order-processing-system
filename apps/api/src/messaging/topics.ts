export const TOPICS = {
  ORDERS_CREATED: 'orders.created',
  ORDERS_PROCESSED: 'orders.processed',
  ORDERS_CREATED_DLQ: 'orders.created.dlq',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];
