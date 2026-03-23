ALTER TABLE outbox_events
ADD COLUMN IF NOT EXISTS partition_key text;

CREATE INDEX IF NOT EXISTS idx_outbox_events_partition_key
ON outbox_events(partition_key);