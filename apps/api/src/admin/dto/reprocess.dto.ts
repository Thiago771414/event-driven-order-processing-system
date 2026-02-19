export type ReprocessDto = {
  originalEvent: {
    correlationId: string;
    idempotencyKey: string;
    type: string;
    [key: string]: unknown;
  };
};
