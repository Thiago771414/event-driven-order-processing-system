# Canary Release in MiniShop

This document describes the safest Canary Release strategy for MiniShop's current architecture.

## Where to Introduce It

The current architecture has three deployment targets:

- **NestJS API**: receives HTTP requests, validates them, and writes `orders`, `payments`, and `outbox_events` to PostgreSQL. It does not publish directly to Kafka.
- **Outbox Worker**: reads the transactional outbox and publishes to Kafka while preserving `partition_key`.
- **Kafka Worker**: consumes `orders.created`, `orders.created.dlq`, `payments.verification.requested`, and `payments.verification.dlq`, with retries, DLQ handling, and Redis idempotency.

The safest place for the first canary is the **API**:

- HTTP traffic can be split by percentage at the Ingress;
- rollback is immediate by reducing the Ingress weight to `0`;
- the API already uses an outbox, so the canary version does not couple HTTP requests directly to Kafka;
- workers and the outbox remain stable during the first phase, reducing risks to ordering, idempotency, and payments.

## Recommended Strategy

Use an **API-level Canary via weighted Ingress NGINX routing** as the default strategy.

Flow:

```text
Client
  -> Ingress NGINX
    -> 95% Service minishop-api        -> Deployment stable v1
    -> 5%  Service minishop-api-canary -> Deployment canary v2
  -> PostgreSQL outbox
  -> Outbox Worker stable
  -> Kafka
  -> Worker stable
```

This approach avoids the operational complexity of a service mesh while providing essential production controls: gradual traffic splitting, observability by version, and fast rollback.

## Rollout Phases

Phase 1:

- apply `kubectl apply -k k8s/canary`;
- keep `nginx.ingress.kubernetes.io/canary-weight: "5"`;
- observe for at least one metrics window sufficient for the actual traffic volume.

Phase 2:

- increase to `25`;
- compare canary versus stable by `release_track` and `app_version`.

Phase 3:

- increase to `50`;
- observe the impact on p95/p99, errors, and business metrics.

Phase 4:

- promote the v2 image to the stable Deployment;
- remove the canary Ingress or set its weight to zero;
- continue monitoring the dashboard for one window after promotion.

Useful commands:

```bash
kubectl apply -k k8s
kubectl apply -k k8s/canary

kubectl annotate ingress minishop-api-canary \
  nginx.ingress.kubernetes.io/canary-weight="25" \
  --overwrite

kubectl annotate ingress minishop-api-canary \
  nginx.ingress.kubernetes.io/canary-weight="0" \
  --overwrite
```

Note: if an older Deployment was already applied without `release-track` in its selector, Kubernetes may require recreating that Deployment because `spec.selector` is immutable.

## Rollback Conditions

Reduce the weight to `0` or remove the canary resources if any condition shows sustained degradation compared with stable:

- increased HTTP `5xx` responses;
- increased p95/p99 in `http_request_duration_ms`;
- increased `orders_retries_total`;
- increased `orders_dlq_total`;
- increased `payment_verification_retries_total`;
- increased `payment_verification_dlq_total`;
- increased `payment_verification_total{result=~"failed|unknown|dlq"}`;
- increased `outbox_failed_total`;
- increased `outbox_lag_seconds`;
- increased Kafka consumer lag, when a Kafka/Redpanda exporter is available.

The `infra/grafana/dashboards/canary-release.json` dashboard uses release labels to compare stable and canary.

## Kafka Workers During a Canary Release

Worker canaries require more care than API canaries.

Recommendation:

- for the first version, keep the **worker and outbox-worker stable**;
- allow the canary API to generate events only if the event contract remains compatible;
- use the same `KAFKA_CONSUMER_GROUP_ID` (`minishop-worker-group`) for workers that actually perform side effects;
- do not use an isolated consumer group to process the same topics in production.

Why avoid an isolated consumer group for an active canary?

A new group consumes the same events independently. This duplicates processing and can duplicate external effects, such as payment updates, derived event publication, and gateway calls. Redis idempotency reduces harm, but it should not justify creating two active pipelines for the same events.

When a worker canary is acceptable:

- compatible, additive changes;
- no changes to external effects;
- the same idempotency semantics;
- the same consumer group;
- rollout with a small number of replicas;
- strong monitoring of retries, DLQs, and consumer lag.

Even within the same consumer group, Kafka rebalances and at-least-once redelivery can occur. Redis idempotency and keys based on `orderId`/`paymentId` remain mandatory.

## Payments

Payment flows should initially avoid canary releases when the change affects:

- authorization/capture;
- status decisions;
- reconciliation;
- webhooks;
- retry rules;
- gateway calls.

For payments, prefer business feature flags with explicit scope:

- by internal customer;
- by environment;
- by payment method;
- by allowlist;
- by read-only/shadow mode.

Percentage-based routing works well for general HTTP traffic. Feature flags are safer for financial decisions because the cohort can be audited and changes reverted without moving pods.

## Event Evolution

During a canary release, events must be compatible across versions.

Rules:

- add optional fields;
- do not remove fields used by stable workers;
- do not change the semantics of existing fields;
- for a breaking change, create a new type, such as `orders.created.v2`;
- keep consumers reading `v1` and `v2` during migration;
- promote the v2 producer only after v2 consumers are ready.

## Comparing Alternatives

### API-Level Canary

The best starting point for this project.

Advantages:

- actual traffic percentages;
- simple rollback at the Ingress;
- lower risk to Kafka, ordering, and idempotency;
- integrates well with HTTP metrics, Prometheus, and traces.

Limitations:

- does not validate substantial worker changes;
- requires compatibility of events generated by the canary API.

### Worker-Level Canary

Useful for changes to asynchronous processing, but should not be the first layer.

Advantages:

- validates new code in the actual consumer;
- preserves partitioning when using the same consumer group.

Risks:

- the percentage is not precise because Kafka distributes partitions;
- rebalances can cause redelivery;
- payment changes can cause incorrect external effects.

### Canary by Kafka Consumer Group

Not recommended for active processing of the same topics.

Use only for:

- shadow consumers without side effects;
- mirrored topics;
- parsing/schema validation;
- read metrics without operationally significant commits.

### Feature flags

Safer for business and payment rules.

A good choice for:

- enabling a new decision algorithm;
- limiting rollout by customer/cohort;
- disabling a new path without redeployment;
- protecting financial flows.

### Blue/Green

Good for quickly switching an entire environment, but less suitable as the first option here.

Advantages:

- simple rollback;
- strong isolation.

Limitations:

- does not offer fine-grained 5/25/50 progression;
- can double operational costs;
- workers and Kafka require extra care to avoid duplicate consumption.

### Service Mesh vs Lightweight Ingress

A service mesh such as Istio/Linkerd offers advanced traffic shifting, mTLS, retries, and rich telemetry.

For this project, the lightweight Ingress NGINX approach is better:

- a smaller operational learning curve;
- fewer components;
- sufficient for HTTP canaries;
- makes it easy to demonstrate maturity without overengineering.

Adopt a mesh only when there is a real need for complex L7 policies, inter-service mTLS, standardized retries, or header/cohort routing across many services.

## Added Observability

Metrics now carry these labels:

- `app_name`;
- `app_version`;
- `deployment_version`;
- `release_track`;
- `canary_cohort`.

Traces carry these OTEL attributes:

- `service.version`;
- `deployment.version`;
- `release.track`;
- `canary.cohort`.

The API also exposes:

- `http_requests_total`;
- `http_request_duration_ms`.

These metrics allow stable/canary comparisons in Prometheus and Grafana.

## Operational Risks

- Low volume can hide regressions; advance phases based on both time and a minimum request count.
- An API canary does not validate worker changes; test those changes with staging or shadow topics.
- Financial flows should initially be protected by a feature flag and an allowlist.
- Schema changes must be backward compatible.
- Code rollback does not undo events already written to the outbox.
- If the canary version emits an invalid event, the harm appears later in the worker; DLQs and retries are therefore mandatory guardrails.

## Final Decision

Implement an **API Canary Release through Ingress NGINX** first, keeping workers stable. Introduce worker canaries only when there is a clear need and a compatible event contract.

This is the smallest production architecture that meets the goals: progressive delivery, fast rollback, preservation of ordering/idempotency, and observability by version.
