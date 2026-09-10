# System Design Lessons

This playbook focuses on engineering lessons that connect frontend architecture
with distributed backend design.

## 1. The API Is the Contract

The API is where the user experience meets distributed systems. It should
expose stable identifiers, status values, error categories, and
retry expectations.

A frontend cannot render accurate product states if the backend
hides pending, failed, or unknown states behind generic success
responses.

## 2. Frontend State Is Temporary

React state supports interaction and rendering. It is not durable and should
not be treated as business truth.

Browser storage can preserve continuity, but it remains local and
potentially stale.

## 3. PostgreSQL Stores Durable Truth

Business records belong in durable transactional storage.
PostgreSQL stores orders, payments, outbox events, and reconciliation
markers.

Redis and Kafka support the system, but they do not replace the system of record.

## 4. Events Require Transactional Discipline

Publishing directly from request handlers creates failure windows. The
outbox pattern closes the gap between database state and event publication.

State is committed first. Events are published after the commit by a
dedicated worker.

## 5. Asynchronous Processing Requires Idempotency

Kafka consumers should assume duplicates. HTTP clients may retry.
Payment gateways may send duplicate webhooks.

Idempotency makes repeated delivery safe.

## 6. Unknown Is a Real State

Payment systems need to represent unknown outcomes. A timeout does not
mean success or failure.

Good systems model:

- pending verification;
- retrying;
- failed;
- confirmed;
- reconciliation needed.

## 7. Caching Is a Consistency Decision

Caching is not just about speed. Every cache needs an owner, an invalidation
strategy, freshness expectations, and a fallback to the source of truth.

Browser caching improves UX. Redis improves backend performance and operational safety.
PostgreSQL remains authoritative.

## 8. Reliability Is Designed Before Failure

Retries, DLQs, backoff, idempotency, and reconciliation are not cleanup tasks.
They are core design elements.

The system should define what happens when each dependency is slow,
unavailable, produces duplicates, or returns inconsistent results.

## 9. Observability Is Part of the Architecture

Metrics show system behavior. Traces show request paths.
Logs show detailed facts.

A distributed workflow is not complete unless engineers can explain it
during normal operation and during failures.

## 10. Progressive Delivery Needs Guardrails

Canary releases work best with measurable health, stable event contracts,
and fast rollback.

For payment decisions, feature flags and allowlists are often safer
than a broad percentage-based rollout.

## 11. Fullstack Design Is One System

Frontend and backend architecture should not be taught as separate worlds.

The checkout button, API contract, database transaction, outbox event,
Kafka worker, Redis idempotency key, and Grafana dashboard are all
part of a single system as experienced by the user.
