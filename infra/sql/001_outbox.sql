CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_unsent ON outbox_events (sent_at) WHERE sent_at IS NULL;
