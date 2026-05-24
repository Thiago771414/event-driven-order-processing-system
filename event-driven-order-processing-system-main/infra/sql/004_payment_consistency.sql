CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  gateway_transaction_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  verification_attempts INT NOT NULL DEFAULT 0,
  next_verification_at TIMESTAMPTZ NULL,
  reconciliation_checked_at TIMESTAMPTZ NULL,
  last_gateway_status TEXT NULL,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_next_verification
  ON payments(status, next_verification_at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  event_id TEXT PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id),
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
