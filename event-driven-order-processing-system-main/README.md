## MiniShop — Event-Driven Distributed Architecture

![Architecture](https://img.shields.io/badge/Architecture-Event%20Driven-orange)
![Messaging](https://img.shields.io/badge/Messaging-Kafka-red)
![Pattern](https://img.shields.io/badge/Pattern-Outbox%20Pattern-blue)
![Pattern](https://img.shields.io/badge/Pattern-Idempotent%20Processing-green)
![Queue](https://img.shields.io/badge/Reliability-DLQ-purple)

![Observability](https://img.shields.io/badge/Observability-Prometheus-orange)
![Dashboards](https://img.shields.io/badge/Dashboards-Grafana-red)
![Tracing](https://img.shields.io/badge/Tracing-Jaeger-blue)
![Telemetry](https://img.shields.io/badge/OpenTelemetry-enabled-green)

![Runtime](https://img.shields.io/badge/Runtime-Node.js-green)
![Language](https://img.shields.io/badge/Language-TypeScript-blue)
![Framework](https://img.shields.io/badge/Framework-NestJS-red)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Cache](https://img.shields.io/badge/Cache-Redis-red)
![Container](https://img.shields.io/badge/Container-Docker-blue)

![AI Observability](https://img.shields.io/badge/AI-MCP%20Diagnostics-purple)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)
![Tests](https://img.shields.io/badge/Tests-Automated-green)
![Reliability](https://img.shields.io/badge/System-Reliability-critical)

Overview

MiniShop is a production-grade distributed system designed to simulate how modern platforms (like Uber, Stripe, and Shopify) handle high-scale event processing.

It demonstrates:

Event-driven architecture with Kafka
Reliable messaging using the Outbox Pattern
Distributed idempotency with Redis
Auto-scaling workers using Kubernetes + KEDA
Full observability (metrics, tracing, AI queries)

<p align="center">
  <img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/kubernetsKeda.png" width="900">
</p>

## Problem

Modern systems must handle:

High concurrency (thousands of events)
Event consistency (no lost or duplicated events)
Scalability (dynamic workload)
Observability (debugging distributed flows)

Naive architectures often fail due to:

Direct API → Kafka coupling
Duplicate processing
Lack of retry strategies
Poor scaling models

## Solution

MiniShop solves these challenges using a decoupled, event-driven architecture:

Key principles:
API writes → Outbox
Outbox Worker publishes → Kafka
Workers consume → process asynchronously
Redis ensures idempotency
KEDA scales workers based on Kafka lag

## Business Value

Architectures like this are widely used in:

e-commerce platforms

payment systems

financial services

logistics platforms

high-traffic APIs

Key benefits:

✔ reliable asynchronous processing
✔ improved scalability
✔ safe event delivery
✔ better system observability
✔ easier fault isolation

---

## Architecture Overview

```ts
Client
  ↓
API (Kubernetes)
  ↓
Postgres (orders + outbox_events)
  ↓
Outbox Worker
  ↓
Kafka (orders.created)
  ↓
Worker (auto-scaled via KEDA)
  ↓
Redis (idempotency)
  ↓
Processing complete
```

## Interactive Architecture Playgrounds

The repository now includes interactive architecture labs and distributed system simulators for educational and operational experimentation. These environments make the boundaries visible between event-driven architecture, AI-assisted operations, secure MCP operational gateways, reliability engineering, distributed tracing, eventual consistency, the transactional outbox, and customer reliability engineering.

| Playground | Description | URL |
|---|---|---|
| Playground: Fullstack System Design Playbook | Interactive frontend architecture lab for distributed system patterns, AI Ops workflows, and observability and resilience simulations. | [Open lab](https://eventual-consistency-simulator-451663135116.us-west1.run.app/) |
| Playground: UML Use Case Sandbox | Interactive UML use case playground demonstrating secure MCP operational boundaries, observability workflows, and AI operations assistants. | [Open sandbox](https://api-gateway-sandbox-690799752664.us-east1.run.app/) |
| Playground: UML Sequence Simulator | Distributed sequence diagram simulator visualizing the Transactional Outbox, Kafka event streaming, eventual consistency, and asynchronous processing. | [Open simulator](https://eventual-consistency-simulator-451663135116.us-west1.run.app/) |

---

## System Demo Video

The repository includes a complete operational demonstration showing Kafka event streaming, Prometheus metrics, Grafana dashboards, Jaeger tracing, MCP operational gateways, AI-assisted operational analysis, and distributed workflow simulations.

**Demo:** [Watch the system video](https://youtu.be/M7fd6nJGt8g)

---

## Engineering Simulation Labs

This repository has grown beyond a backend API project. It also serves as an architecture playground inspired by Uber engineering, Stripe reliability engineering, Netflix distributed systems, and Mercado Livre platform engineering.

- Distributed tracing visualization
- Event streaming simulations
- Educational Transactional Outbox sandbox
- Reliability and SRE experimentation
- Secure MCP AI operational gateway
- Customer trust and operational transparency simulations
- AI-assisted architecture diagnostics
- Interactive UML architecture modeling

---

## Screenshots and Architecture Visualizations

Placeholder for the visual gallery of sandboxes and observability consoles:

- AI Operations Console
- Transactional Outbox Simulator
- UML Use Case Sandbox
- Distributed Sequence Flow
- Customer Reliability Console
- Grafana Observability Dashboard
- Jaeger Distributed Tracing

## Payment Consistency Saga

The payment flow uses an orchestrated Saga with the API on the checkout critical path and the worker orchestrating asynchronous verification. The API never publishes directly to Kafka: it persists `orders`, `payments`, and `outbox_events` in the same transaction; the outbox-worker publishes the events.

Domain statuses used:

`PEDIDO_PENDENTE`, `PAGAMENTO_PENDENTE`, `PAGAMENTO_PENDENTE_VERIFICAÇÃO`, `PAGAMENTO_CONFIRMADO`, `PEDIDO_CONFIRMADO`, `PAGAMENTO_FALHOU`, `PEDIDO_CANCELADO`, `RECONCILIAÇÃO_NECESSÁRIA`.

New Kafka topics:

`payments.verification.requested`, `payments.confirmed`, `payments.failed`, `payments.verification.dlq`, `payments.reconciliation.needed`.

```mermaid
flowchart TD
  C[Client] --> A[API POST /orders]
  A --> G[First synchronous gateway attempt]

  G -->|confirmed| TX1[Postgres transaction: order PEDIDO_CONFIRMADO + payment PAGAMENTO_CONFIRMADO + outbox PaymentConfirmed]
  TX1 --> O1[Outbox Worker]
  O1 --> K1[Kafka payments.confirmed]

  G -->|failed| TX2[Postgres transaction: order PEDIDO_CANCELADO + payment PAGAMENTO_FALHOU + outbox PaymentFailed]
  TX2 --> O2[Outbox Worker]
  O2 --> K2[Kafka payments.failed]

  G -->|timeout or unknown| TX3[Postgres transaction: order PEDIDO_PENDENTE + payment PAGAMENTO_PENDENTE_VERIFICAÇÃO + outbox PaymentVerificationRequested]
  TX3 --> O3[Outbox Worker]
  O3 --> K3[Kafka payments.verification.requested]

  K3 --> W[Verification worker]
  W --> R[Redis lock/idempotency]
  R --> Q[Poll gateway by idempotencyKey or transactionReference]
  Q -->|confirmed| WC[DB + outbox PaymentConfirmed]
  Q -->|rejected or not found| WF[DB + outbox PaymentFailed]
  Q -->|temporary error| RET[Retry with backoff]
  RET -->|limit exceeded| DLQ[Kafka payments.verification.dlq]

  GW[Gateway webhook] --> WH[API POST /payments/webhooks]
  WH --> WHI[Dedup in payment_webhook_events]
  WHI -->|confirmed/failed/unknown| WHTX[DB + outbox PaymentConfirmed, PaymentFailed or PaymentVerificationRequested]

  B[Periodic reconciliation job] --> P[Fetch pending payments or those in RECONCILIAÇÃO_NECESSÁRIA]
  P --> BG[Compare with gateway records]
  BG -->|correct| BOK[DB + outbox PaymentConfirmed or PaymentFailed]
  BG -->|inconsistent| ALERT[Mark RECONCILIAÇÃO_NECESSÁRIA + outbox payments.reconciliation.needed + metric/log]
```

Added observability:

`payment_webhooks_total`, `payment_verification_total`, `payment_verification_retries_total`, `payment_verification_dlq_total`, `payment_reconciliation_total`, and `payment_verification_duration_ms`, along with `payments.verify` spans and logs containing `correlationId`, `paymentId`, and the gateway reference.

## Core Components

🔵 API (NestJS)
Receives requests
Validates input
Writes:
orders
outbox_events
Does NOT publish to Kafka directly
🟡 PostgreSQL (Outbox Pattern)
Guarantees atomicity:
```ts
Order + Event in same transaction
```
Prevents lost events
🟣 Outbox Worker
Reads pending events
Publishes to Kafka
Handles:
retries
exponential backoff
DLQ (dead-letter queue)
🔴 Kafka
Event backbone
Topics:
orders.created
orders.created.DLQ
Uses partition_key = orderId → ensures ordering
🟢 Worker (Consumer)
Consumes Kafka events
Processes orders
Uses:
retry
DLQ fallback
metrics + tracing
🟠 Redis (Idempotency)

Ensures:
```ts
1 event = 1 effective processing
```
Prevents:

duplicate messages
reprocessing errors
⚫ KEDA (Auto Scaling)
Scales workers based on:
```ts
Kafka lag
```
Example:
```ts
lag = 0 → 0 pods
lag = high → scale up automatically
```

## Key Engineering Concepts

Event-Driven Architecture

Requests are processed through asynchronous event pipelines.

Outbox Pattern

Ensures reliable event publishing and prevents event loss during database transactions.

Idempotent Processing

Workers guarantee safe processing even when retries occur.

Dead Letter Queue (DLQ)

Failed events are redirected for inspection and manual replay.

Distributed Observability

Metrics, logs, and traces provide full system visibility.

## Observability

Prometheus metrics expose:

event throughput

processing failures

retry rates

outbox lag

Grafana dashboards enable real-time monitoring.

Jaeger provides distributed tracing across the system.

## Local Docker Infrastructure Notes

Local Docker images are pinned when startup stability matters. The Redpanda broker uses `redpandadata/redpanda:v24.2.7` instead of `latest` because newer latest tags can enable behavior that is not suitable for this lightweight community development setup on Docker Desktop.

The OpenTelemetry Collector sends traces to Jaeger through OTLP gRPC using `otlp/jaeger` and `minishop-jaeger:4317`. The older `jaeger` exporter is not used because recent Collector versions no longer include it. Prometheus metrics scraping remains configured in `infra/prometheus.yml`.

```ts
HTTP → Kafka → Worker → Database
```
<p align="center">
  <img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/observalidade.png" width="900">
</p>

Observability Layer:

```ts
Prometheus ← metrics
Grafana ← dashboards
Jaeger ← traces
MCP server ← AI diagnostics
MCP Server → AI-powered querying
```
Query system health using PromQL via MCP

## AI-Assisted Observability (MCP)

The system includes an MCP server that allows AI agents to query monitoring data such as:

Prometheus metrics

system health targets

diagnostic insights

This enables AI-assisted troubleshooting and automated diagnostics.

## Reliability Features
✅ Outbox Pattern
Prevents event loss
✅ Idempotency (Redis)
Prevents duplicate processing
✅ Retry + Backoff
Handles transient failures
✅ DLQ (Dead Letter Queue)
Captures failed events safely
✅ Partitioned Kafka
Guarantees ordering per entity

## Scalability
Horizontal scaling via Kubernetes + KEDA
```ts
Workers scale automatically based on Kafka lag
```
Separation of concerns
<div align="center">

| Component | Strategy |
| :--- | ---: |
| API | CPU-based |
| Worker | Event-based scaling |
| Outbox Worker | Throughput-based |

</div>

## Repository Structure
```ts
minishop/
├── apps/
│   ├── api/              # REST API (Producer)
│   ├── worker/           # Kafka consumer
│   ├── outbox-worker/    # Outbox publisher
│   └── web/              # placeholder
│
├── infra/
│   ├── docker-compose.yml
│   ├── prometheus.yml
│   ├── otel-collector.yaml
│   └── grafana/
│
├── k8s/                  # Kubernetes manifests
│
├── mcp/                  # AI observability server
│
├── diagrams/
│
└── README.md
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/arquitetura.png" width="900">
</p>

## 🔧 Core Components

API

exposes REST endpoint (POST /orders)

validates incoming payloads

stores orders in PostgreSQL

writes events to the outbox table

ensures correlation and idempotency

Important: the API does not publish directly to Kafka.

Worker

Kafka consumer

guarantees idempotent processing

implements retry logic and DLQ handling

processes orders asynchronously

exposes processing metrics

Outbox Worker

polls the database outbox table

publishes events to Kafka

ensures transactional consistency

exposes outbox-specific metrics

## Outbox Pattern

The API writes both the order and event in the same database transaction.

After the transaction commits, the Outbox Worker publishes the event to Kafka.

Benefits:

✅ guaranteed consistency
✅ zero event loss
✅ safe reprocessing
✅ full auditability

DLQ & Reprocessing

Failed events are redirected to:
```ts
orders.created.dlq
```
Administrative endpoint:
```ts
POST /admin/dlq/reprocess
```
Allows controlled manual replay of failed events.

## Metrics

Prometheus tracks:

event throughput

processing failures

retry attempts

outbox lag

in-flight events

Metrics endpoints:

```ts
API:            :3000/metrics
Worker:         :9100/metrics
Outbox Worker:  :9200/metrics
```
## Grafana Dashboards

Dashboards are versioned in:
```ts
infra/grafana/dashboards/
```
Visualizations include:

event throughput

processing failures

outbox lag

latency

## Distributed Tracing

Powered by OpenTelemetry + Jaeger
```ts
http://localhost:16686
```
Tracks the full request lifecycle:
```ts
HTTP → Kafka → Worker → Database
```

## Canary Release

The project now includes a lightweight Canary Release strategy for the API using weighted Ingress NGINX routing, version labels, Prometheus metrics by cohort, and OpenTelemetry tags.

Operational documentation:

```ts
docs/canary-release.md
```

## Tests

unit tests

integration tests

## Technology Stack

Node.js + TypeScript

NestJS

Kafka (Redpanda)

PostgreSQL

Redis

Prometheus

Grafana

OpenTelemetry

Jaeger

Docker

Kubernetes

MCP (AI tooling)
  
## ▶Running Locally

Create the local environment file:
```bash
cp .env.example .env
```

Required local Docker values:
```bash
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/minishop
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
KAFKA_BROKER=localhost:9092
```

`KAFKA_BROKERS` is the preferred variable. `KAFKA_BROKER` is kept as a backward-compatible alias for older scripts and app code.

Start infrastructure:
```bash
pnpm infra:up
```

Apply the local database schema before starting API or workers:
```bash
pnpm db:migrate
```

The local Postgres container also mounts `infra/sql` into `/docker-entrypoint-initdb.d`, so a fresh Docker volume initializes the schema automatically. Keep `pnpm db:migrate` in the setup flow anyway; the SQL files are idempotent and this protects existing local volumes from missing tables such as `outbox_events`.

Run API:
```bash
pnpm -C apps/api start:dev
```

Local API health check: http://localhost:3000/healthz

Run outbox worker:
```bash
pnpm -C apps/outbox-worker start:dev
```

Run worker:
```bash
pnpm -C apps/worker start:dev
```

Run the educational frontend playbook from the sibling frontend project when needed:
```bash
cd ../fullstack-system-design-playbook
pnpm dev
```

Run MCP:
```bash
pnpm -C mcp dev
```
## Kubernetes Deployment

Apply manifests:

```bash
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/worker-keda.yaml
```
Check system:

```bash
kubectl get pods -n minishop
kubectl logs -n minishop deployment/worker
kubectl get scaledobject -n minishop
```

## Design Decisions

# Why Outbox?

Avoids:

lost events
inconsistent state

# Why Kafka?

Enables:

decoupling
scalability
event streaming

# Why Redis?

Handles:

distributed idempotency
real-world duplicate scenarios

# Why KEDA?

Provides:

event-driven scaling
cost-efficient infrastructure

## Real-World Relevance

This architecture mirrors patterns used by:

Stripe (event processing)
Uber (asynchronous systems)
Shopify (order pipelines)

## What This Project Demonstrates

Distributed system design
Event-driven architecture
Production-grade reliability patterns
Kubernetes + autoscaling
Observability best practices
AI-powered system introspection (MCP)

## Future Improvements

CD pipeline (GitHub Actions → Kubernetes)
Helm charts for deployment
Kafka cluster inside Kubernetes
Multi-region replication
AI agent for auto-debugging (MCP + LLM)

## Author - Thiago Reis Lima
Software Engineer & AI Systems Builder
Focused on scalable architectures, automation, and real-world systems.

## Final Note

This is not just a demo.

It’s a production-inspired system design showcasing how modern distributed platforms are built.
