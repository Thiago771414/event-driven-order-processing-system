import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

export type OutboxEventRow = {
  id: string;
  topic: string;
  payload: unknown;
  correlationId: string;
  idempotencyKey: string;
  eventType: string;
  partitionKey: string | null;
};

type OldestRow = { oldest: string | null };

@Injectable()
export class OutboxRepository {
  constructor(private readonly db: DbService) {}

  async fetchPending(limit = 50): Promise<OutboxEventRow[]> {
    const workerId = process.env.HOSTNAME ?? `outbox-worker-${process.pid}`;

    const result = await this.db.pool.query<{
      id: string;
      topic: string;
      payload: unknown;
      correlation_id: string;
      idempotency_key: string;
      event_type: string;
      partition_key: string | null;
    }>(
      `
      WITH cte AS (
        SELECT id
        FROM outbox_events
        WHERE sent_at IS NULL
          AND (locked_at IS NULL OR locked_at < now() - interval '30 seconds')
          AND next_attempt_at <= now()
          AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events e
      SET locked_at = now(),
          locked_by = $2
      FROM cte
      WHERE e.id = cte.id
      RETURNING
        e.id,
        e.topic,
        e.payload,
        e.correlation_id,
        e.idempotency_key,
        e.event_type,
        e.partition_key
      `,
      [limit, workerId],
    );

    const rows = result.rows;

    return rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      payload: r.payload,
      correlationId: r.correlation_id,
      idempotencyKey: r.idempotency_key,
      eventType: r.event_type,
      partitionKey: r.partition_key ?? null,
    }));
  }

  async markPublished(id: string) {
    await this.db.pool.query(
      `
    UPDATE outbox_events
    SET sent_at = now(),
        locked_at = NULL,
        locked_by = NULL,
        last_error = NULL
    WHERE id = $1
    `,
      [id],
    );
  }

  async markFailed(id: string, errorMessage: string) {
    await this.db.pool.query(
      `
    UPDATE outbox_events
    SET attempts = attempts + 1,
        last_error = $2,
        locked_at = NULL,
        locked_by = NULL,
        next_attempt_at = now() + (
          CASE
            WHEN attempts < 1 THEN interval '5 seconds'
            WHEN attempts < 2 THEN interval '15 seconds'
            WHEN attempts < 3 THEN interval '60 seconds'
            ELSE interval '5 minutes'
          END
        )
    WHERE id = $1
    `,
      [id, errorMessage],
    );
  }

  async getOldestPendingCreatedAt(): Promise<Date | null> {
    const result = await this.db.pool.query<OldestRow>(`
      SELECT MIN(created_at) AS oldest
      FROM outbox_events
      WHERE sent_at IS NULL
    `);

    const oldest = result.rows[0]?.oldest ?? null;
    return oldest ? new Date(oldest) : null;
  }
}