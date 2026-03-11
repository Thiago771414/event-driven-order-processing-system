## 🚀 MiniShop — Event-Driven Distributed Architecture

Production-grade distributed system demonstrating event-driven architecture, reliability patterns, and full observability.

This project simulates how large-scale platforms process orders through asynchronous event pipelines, ensuring scalability, resilience, and traceability across distributed services.

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

## 🎯 Problem

Modern platforms must handle high volumes of requests while maintaining reliability and scalability.

Traditional synchronous architectures often suffer from:

tight coupling between services

cascading failures across the system

difficulty handling traffic spikes

limited observability and traceability

Systems responsible for critical workflows — such as orders, payments, or financial transactions — require architectures that guarantee data consistency and reliable asynchronous processing.

## 💡 Solution

MiniShop demonstrates a production-style event-driven architecture built with Kafka and the Outbox Pattern.

Instead of processing requests synchronously, the system separates responsibilities across independent components:

REST API receives requests

PostgreSQL stores orders and events in an outbox table

Outbox Worker publishes events to Kafka

Worker Services consume and process events asynchronously

This architecture ensures reliable event delivery, horizontal scalability, and improved fault tolerance.

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

<p align="center">
  <img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/arquitetura.png" width="900">
</p>

```ts
Client
  ↓
API (REST)
  ↓
PostgreSQL (orders + outbox)
  ↓
Outbox Worker → Kafka
  ↓
Worker Consumer
  ↓
Idempotent processing
  ↓
Redis + PostgreSQL
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
```
## 🤖 AI-Assisted Observability (MCP)

The system includes an MCP server that allows AI agents to query monitoring data such as:

Prometheus metrics

system health targets

diagnostic insights

This enables AI-assisted troubleshooting and automated diagnostics.

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

Kubernetes manifests are available in:
```ts
/k8s
```
Deploy with:
```ts
kubectl apply -k k8s/
```
## 🚀 Possible Extensions

GKE deployment

GitHub Actions CD

API Gateway (Apigee)

feature flags

BFF architecture

hexagonal architecture

circuit breaker pattern

chaos testing

## 👤 Autor - Thiago Reis Lima
Distributed Systems Engineering Case Study
