// apps/outbox-worker/src/outbox/outbox.repository.ts
import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

export type OutboxEventRow = {
  id: string;
  topic: string;
  payload: unknown;

  correlationId: string;
  idempotencyKey: string;
  eventType: string;
};

@Injectable()
export class OutboxRepository {
  constructor(private readonly db: DbService) {}

  /**
   * Busca e "reserva" eventos pendentes usando lock otimista no banco.
   * - só pega sent_at IS NULL
   * - só pega next_attempt_at <= now()
   * - respeita max_attempts
   * - marca locked_at/locked_by e devolve os eventos reservados
   */
  async fetchPending(limit = 50): Promise<OutboxEventRow[]> {
    const workerId = process.env.HOSTNAME ?? `outbox-worker-${process.pid}`;

    const { rows } = await this.db.pool.query(
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
        e.event_type
      `,
      [limit, workerId],
    );

    return rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      payload: r.payload,
      correlationId: r.correlation_id,
      idempotencyKey: r.idempotency_key,
      eventType: r.event_type,
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
    // backoff simples: tenta de novo em 5s, 15s, 60s, 5min...
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
    const { rows } = await this.db.pool.query(
      `
    SELECT MIN(created_at) AS oldest
    FROM outbox_events
    WHERE sent_at IS NULL
    `,
    );

    const oldest = rows?.[0]?.oldest as string | null;
    return oldest ? new Date(oldest) : null;
  }
}
