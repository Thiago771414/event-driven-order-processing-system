## 🚀 MiniShop — Event-Driven Distributed Architecture

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

## 🧠 Problem

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

## 💡 Solution

MiniShop solves these challenges using a decoupled, event-driven architecture:

Key principles:
API writes → Outbox
Outbox Worker publishes → Kafka
Workers consume → process asynchronously
Redis ensures idempotency
KEDA scales workers based on Kafka lag

## 💼 Business Value

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

## 🧠 Architecture Overview

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
## ⚙️ Core Components

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

## ⚙️ Key Engineering Concepts

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

## 📊 Observability

Prometheus metrics expose:

event throughput

processing failures

retry rates

outbox lag

Grafana dashboards enable real-time monitoring.

Jaeger provides distributed tracing across the system.

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

## 🤖 AI-Assisted Observability (MCP)

The system includes an MCP server that allows AI agents to query monitoring data such as:

Prometheus metrics

system health targets

diagnostic insights

This enables AI-assisted troubleshooting and automated diagnostics.

## 🔐 Reliability Features
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

## 📈 Scalability
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

## 📁 Repository Structure
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

##📦 Outbox Pattern

The API writes both the order and event in the same database transaction.

After the transaction commits, the Outbox Worker publishes the event to Kafka.

Benefits:

✅ guaranteed consistency
✅ zero event loss
✅ safe reprocessing
✅ full auditability

🔄 DLQ & Reprocessing

Failed events are redirected to:
```ts
orders.created.dlq
```
Administrative endpoint:
```ts
POST /admin/dlq/reprocess
```
Allows controlled manual replay of failed events.

##📊 Metrics

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
## 📈 Grafana Dashboards

Dashboards are versioned in:
```ts
infra/grafana/dashboards/
```
Visualizations include:

event throughput

processing failures

outbox lag

latency

## 🔎 Distributed Tracing

Powered by OpenTelemetry + Jaeger
```ts
http://localhost:16686
```
Tracks the full request lifecycle:
```ts
HTTP → Kafka → Worker → Database
```

## 🧪 Testes

unit tests

integration tests

## 🛠️ Technology Stack

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
  
## ▶️ Running Locally

Start infrastructure:
```ts
pnpm infra:up
```
Run API:
```ts
pnpm -C apps/api start:dev
```
Run worker:
```ts
pnpm -C apps/worker start:dev
```
Run outbox worker:
```ts
pnpm -C apps/outbox-worker start:dev
```
Run MCP:
```ts
pnpm -C mcp dev
```
## ☸️ Kubernetes Deployment

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

## 🧠 Design Decisions

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

## 💼 Real-World Relevance

This architecture mirrors patterns used by:

Stripe (event processing)
Uber (asynchronous systems)
Shopify (order pipelines)

## 🚀 What This Project Demonstrates

Distributed system design
Event-driven architecture
Production-grade reliability patterns
Kubernetes + autoscaling
Observability best practices
AI-powered system introspection (MCP)

##🔥 Future Improvements

CD pipeline (GitHub Actions → Kubernetes)
Helm charts for deployment
Kafka cluster inside Kubernetes
Multi-region replication
AI agent for auto-debugging (MCP + LLM)

## 👤 Autor - Thiago Reis Lima
Software Engineer & AI Systems Builder
Focused on scalable architectures, automation, and real-world systems.

## ⭐ Final Note

This is not just a demo.

👉 It’s a production-inspired system design showcasing how modern distributed platforms are built.
