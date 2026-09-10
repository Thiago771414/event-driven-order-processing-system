# Worker Contracts for Sagas

Workers are processes that execute individual workflow tasks. In the Netflix Conductor-inspired model, Conductor maintains the task queue and state while workers poll for available tasks, perform local work, and report the result.

## Task Polling

A worker polls Conductor for tasks of a specific type, such as `autorizar_pagamento` or `reservar_estoque`. The conceptual response contains:

- `taskId`;
- `workflowId`;
- `correlationId`;
- input parameters;
- attempt number;
- deadlines and timeouts;
- observability metadata.

The worker should treat the task as an idempotent unit. If the same task reappears after a timeout, retry, or process restart, execution should not create duplicate effects.

## Task Completion

On completion, the worker sends Conductor:

- success status;
- a minimal, typed output payload;
- duration;
- external references, such as `paymentReference` or `orderId`;
- observability signals.

The output payload should be sufficient for the next workflow step to decide what to do, but it should not become a parallel database.

## Task Failure

On failure, the worker should distinguish between:

- a temporary failure, such as a gateway timeout;
- a business failure, such as a rejected payment;
- an unrecoverable technical failure, such as an invalid payload;
- an unknown outcome, such as a lost connection after calling the gateway.

This distinction determines whether Conductor retries, proceeds to a verification task, executes compensation, or sends the case to the DLQ.

## Retry Policy

Retries should be configured per task. A conceptual example:

| Task | Attempts | Backoff | Note |
| --- | --- | --- | --- |
| `autorizar_pagamento` | 3 | short exponential | safe only with a gateway idempotency key |
| `reservar_estoque` | 3 | short exponential | must deduplicate by `orderId` |
| `confirmar_pedido` | 2 | short linear | local database update |
| `publicar_pedido_confirmado` | 5 | exponential | outbox protects publication |

Retries do not replace idempotency. They only make temporary failures recoverable.

## Timeout Policy

Timeouts should exist at two levels:

- task timeout, to prevent a worker from remaining stuck indefinitely;
- workflow timeout, to prevent the entire saga from remaining open without a decision.

When a task times out, the workflow can retry it, call a verification task, or suspend the flow for investigation.

## Idempotency

Each worker should use stable keys:

- `workflowId`;
- `taskId`;
- `correlationId`;
- `orderId`;
- `paymentId`;
- `idempotencyKey`.

External operations, such as payment authorization and refunds, need an idempotency key accepted by the external provider. Internal operations can use Redis, PostgreSQL constraints, or deduplication tables.

## Compensation Tasks

Tasks such as `reembolsar_pagamento`, `cancelar_pedido`, and `publicar_pedido_cancelado` must be treated as first-class workflows:

- they must be idempotent;
- they must have their own retries;
- they must emit clear events and logs;
- they must preserve the reason for compensation;
- they must be visible in the workflow history.

Compensation does not mean erasing the past. It records a new action that reverses or neutralizes the effect of an earlier step.

## Observability

Each worker should emit:

- structured logs with `workflowId`, `taskId`, `orderId`, and `correlationId`;
- metrics for latency, success, failure, retry, and timeout;
- tracing spans connected to the trace started by the API;
- audit events for important state changes.

The operational goal is to quickly answer which step failed, how many attempts it made, which service was responsible, and which compensating action was executed.
