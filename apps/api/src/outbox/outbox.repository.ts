import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class OutboxRepository {
  constructor(private readonly db: DbService) {}

  async claimBatch(limit: number, lockerId: string, lockTtlSec: number) {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');

      // pega eventos prontos, ignora os já lockados por outro, e locka a linha
      const { rows } = await client.query(
        `
        SELECT *
        FROM outbox_events
        WHERE sent_at IS NULL
          AND next_attempt_at <= now()
          AND (
            locked_at IS NULL
            OR locked_at < now() - ($2 || ' seconds')::interval
          )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $1
        `,
        [limit, lockTtlSec],
      );

      if (rows.length === 0) {
        await client.query('COMMIT');
        return [];
      }

      const ids = rows.map((r) => r.id);

      await client.query(
        `
        UPDATE outbox_events
        SET locked_at = now(), locked_by = $2
        WHERE id = ANY($1::uuid[])
        `,
        [ids, lockerId],
      );

      await client.query('COMMIT');
      return rows;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async markSent(id: string) {
    await this.db.pool.query(
      `UPDATE outbox_events SET sent_at = now(), locked_at = NULL, locked_by = NULL WHERE id = $1`,
      [id],
    );
  }

  async markFailed(id: string, error: string, baseBackoffMs: number) {
    // backoff exponencial baseado em attempts
    // next_attempt = now + base * 2^attempts (cap de 60s)
    await this.db.pool.query(
      `
      UPDATE outbox_events
      SET
        attempts = attempts + 1,
        last_error = $2,
        locked_at = NULL,
        locked_by = NULL,
        next_attempt_at = now() + (LEAST(60000, $3 * (2 ^ attempts)) || ' milliseconds')::interval
      WHERE id = $1
      `,
      [id, error, baseBackoffMs],
    );
  }

  async markDead(id: string, error: string) {
    await this.db.pool.query(
      `
      UPDATE outbox_events
      SET
        attempts = attempts + 1,
        last_error = $2,
        locked_at = NULL,
        locked_by = NULL,
        next_attempt_at = 'infinity'::timestamptz
      WHERE id = $1
      `,
      [id, error],
    );
  }
}
