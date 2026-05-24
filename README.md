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

# MiniShop — Distributed Event-Driven Architecture

**MiniShop** is an enterprise-grade, high-throughput distributed ecosystem engineered to demonstrate how modern hyper-scale platforms orchestrate resilient asynchronous transaction pipelines.

<div align="center">

![MiniShop — Distributed Architecture Topology (Kubernetes + KEDA)](https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/kubernetsKeda.png)
*Figure 1: End-to-End Enterprise Kubernetes Topography featuring KEDA, Transactional Outbox Workers, and OpenTelemetry Diagnostics*

</div>

---

## Executive Summary

The project serves as an architectural blue-print for executing safe progressive delivery models, mitigating event loss via atomicity invariants, and enforcing edge-level distributed deduplication.

### Architectural Core Focus:
*   **Decoupled Async Pipelines:** Event-Driven choreography backed by an enterprise messaging mesh.
*   **Guaranteed Atomicity:** Dual-Write mitigation using the transactional append-only outbox design pattern.
*   **Ultra-Low Latency Guard Rails:** Distributed high-performance check-and-set idempotency memory locks.
*   **Dynamic Load Elasticity:** Predictive autoscaling topologies responsive directly to queue backlog thresholds.
*   **Deep System Observability:** Context-propagated tracing metrics unified under autonomous AI diagnostics.

---

## The Distributed Engineering Challenge

When designing production-grade software ecosystems at scale, platform engineers face distinct distributed computing vulnerabilities that classic monochromatic architectures fail to resolve.

### Naive Anti-Patterns & Failure Modes
1.  **Direct API-to-Broker Coupling:** Firing events to network message brokers directly inside live HTTP threads risks catastrophic thread starvation or data loss if the broker experiences transient drops or sudden network partitions.
2.  **The Dual-Write Dilemma:** Attempting to update a relational database state and push a message over the network simultaneously lacks single-phase commit safety. One operation inevitably succeeds while the other fails, creating corrupt state drift.
3.  **Thundering Herd & Poison Pills:** Naive consumer processing loops without randomized retry exponential backoffs often trigger cascade overloads across downstream infrastructure databases. Unparseable payloads can lock consumer partitions entirely.
4.  **Static Metric Resource Exhaustion:** Scaling background consumer pods based strictly on trailing resource indicators (CPU and Memory exhaustion) reacts too slowly to sudden event stream explosions, inducing high customer queue latency.

---

## The Solution: Decoupled Fault-Tolerant Topology

MiniShop completely isolates the ingress boundaries from downstream asynchronous computation weight using a specialized, state-locked architectural stack.

## Interactive Architecture Experimentation Environments

The repository now includes interactive architecture labs and distributed systems simulators for educational and operational experimentation. These environments visually map the boundaries between event-driven architecture, AI-assisted operations, secure operational gateways for MCP, reliability engineering, distributed tracing, eventual consistency, transactional outbox, and customer reliability engineering.

```mermaid
flowchart TD

    A[Client Request]
    --> B[Ingress API Gateway]

    subgraph Persistence Layer
        C[(PostgreSQL DB Engine)]
        D[Outbox Events Ledger]
    end

    subgraph Messaging Layer
        E[Outbox Publisher Node]
        F[Apache Kafka Mesh]
    end

    subgraph Processing Layer
        G[Asynchronous Consumers]
        H[Redis Idempotency Lock]
    end

    B -->|Atomic ACID Commit| C
    C --> D
    D -->|Asynchronous Polling| E
    E -->|Partitioned Stream| F
    F -->|Dynamic KEDA Auto-Scaling| G
    G --> H
```

### Technical Resolution Framework:
*   **Local State Lock:** The API layer persists business entity schemas and respective outbound event objects concurrently into PostgreSQL within a single local transaction block.
*   **Reliable Relaying:** A decoupled background Outbox Worker extracts rows sequentially from the event tables and pushes them cleanly into Kafka, ensuring eventual consistency targets.
*   **Deduplication Safeguard:** Processing instances validate incoming messages against a fast Redis memory index using an atomic *Set-If-Not-Exists* pattern to drop duplications out-of-band.
*   **Lag-Driven Scaling:** KEDA continuously checks the specific consumer group backlog directly inside Kafka, scaling worker pod density down to absolute zero or up to full capacity adaptively.

---

## High-Volume Business Value Matrix

This decoupled blueprint provides enterprise stability, high availability, and operational protection across critical transactional industry verticals.

| Operational Vertical | Core System Threat | Architecture Mitigation Value | Business Impact |
| :--- | :--- | :--- | :--- |
| **E-Commerce & Checkout** | Concurrency checkout peaks | Isolation of order captures from intensive ledger calculations. | Reduced cart abandonment rates under massive event surges. |
| **Payment Ledger Processing** | Network transaction failures | Asynchronous retry loop execution with background DLQ fallback routing. | Elimination of phantom double-charges and missed account reconciliations. |
| **Logistics & Real-Time Tracking** | Out-of-order state tracking | Group partition key routing tied strictly to unique entity IDs. | Exact FIFO sequential event delivery for high-precision auditing. |
| **Platform Observability (SRE)** | High telemetry noise | Distributed tracing correlation IDs paired with secure MCP AI analysis. | Accelerated Mean-Time-To-Resolution (MTTR) during critical live incidents. |

---

## Interactive Architecture Labs & Playgrounds

## Playground Previews & UML Architectures

<div align="center">

| Preview | Playground | Description | Access |
| :---: | --- | --- | :---: |
| <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(1).jpeg" width="260" alt="Fullstack Systems Design Manual"></a> | **Fullstack Systems Design Manual** | Interactive frontend architecture lab for distributed systems patterns, AI Ops workflows, observability, resilience simulations, and event-driven system design. | <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/">Open Lab</a> |
| <a href="https://api-gateway-sandbox-690799752664.us-east1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(1).png" width="260" alt="UML Use Case Sandbox"></a> | **UML Use Case Sandbox** | Interactive UML playground demonstrating secure operational boundaries for MCP workflows, observability pipelines, and AI operational assistants. | <a href="https://api-gateway-sandbox-690799752664.us-east1.run.app/">Open Sandbox</a> |
| <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(2).png" width="260" alt="UML Sequence Simulator"></a> | **UML Sequence Simulator** | Distributed sequence simulator visualizing Transactional Outbox, Kafka event streaming, eventual consistency, retries, DLQ, and asynchronous workflows. | <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/">Open Simulator</a> |
| <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(3).png" width="260" alt="Distributed Architecture"></a> | **Distributed Architecture Blueprint** | Architectural visualization covering bounded contexts, distributed orchestration, resilience patterns, and scalable event-driven communication. | <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/">Explore Architecture</a> |
| <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(4).png" width="260" alt="Distributed Flow"></a> | **Distributed Flow Simulator** | Interactive distributed flow visualizer for asynchronous processing, observability tracing, event choreography, and transactional reliability. | <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/">Open Flow</a> |
| <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/"><img src="https://raw.githubusercontent.com/Thiago771414/imagensProjetos/main/slices/mobile/uml%20(5).png" width="260" alt="Metrics Dashboard"></a> | **Metrics & Observability Dashboard** | Operational dashboard preview demonstrating metrics pipelines, distributed tracing, monitoring strategies, and AI Ops visibility. | <a href="https://eventual-consistency-simulator-451663135116.us-west1.run.app/">Open Dashboard</a> |

</div>

---

<p align="center">
<i>Click any architectural preview to open the interactive engineering playground.</i>
</p>

---

## System Demonstration Video

The repository includes a complete operational demo showcasing Kafka event streaming, Prometheus metrics, Grafana dashboards, Jaeger tracing, MCP operational gateways, AI-assisted operational analysis, and distributed workflow simulations.

[![Watch the System Video](https://shields.io)](https://youtu.be/M7fd6nJGt8g)

*Watch our end-to-end telemetry and operations breakdown on YouTube.*

---

## Engineering Simulation Labs

This repository is no longer just a backend API project. It also serves as an architecture experimentation environment inspired by Uber Engineering, Stripe Reliability Engineering, Netflix Distributed Systems, and Mercado Libre Platform Engineering.

- Distributed tracing visualization
- Event streaming simulations
- Educational testing environment for Transactional Outbox
- Reliability and SRE experimentation
- Secure AI operational gateway for MCP
- Customer trust and operational transparency simulations
- AI-assisted architecture diagnostics
- Interactive UML architecture modeling

---

## Screenshots and Architecture Visualizations

Placeholder for the visual gallery of test environments and observability consoles:

- AI Operations Console
- Transactional Outbox Simulator
- UML Use Case Sandbox
- Distributed Sequence Flow
- Customer Reliability Console
- Grafana Observability Dashboard
- Jaeger Distributed Tracing

## Payment Consistency Saga

The payment flow utilizes an orchestrated Saga with the API in the critical path of the checkout, and a background worker acting as the asynchronous verification orchestrator. The API never publishes directly to Kafka: it persists `orders`, `payments`, and `outbox_events` within the same database transaction; the outbox-worker is responsible for publishing the events.

### Domain Statuses Used:

`PEDIDO_PENDENTE`, `PAGAMENTO_PENDENTE`, `PAGAMENTO_PENDENTE_VERIFICAÇÃO`, `PAGAMENTO_CONFIRMADO`, `PEDIDO_CONFIRMADO`, `PAGAMENTO_FALHOU`, `PEDIDO_CANCELADO`, `RECONCILIAÇÃO_NECESSÁRIA`.

### New Kafka Topics:

`payments.verification.requested`, `payments.confirmed`, `payments.failed`, `payments.verification.dlq`, `payments.reconciliation.needed`.

```mermaid
flowchart TD
  C[Client] --> A[API POST /orders]
  A --> G[First synchronous attempt at the gateway]

  G -->|confirmed| TX1[Postgres Transaction: order PEDIDO_CONFIRMADO + payment PAGAMENTO_CONFIRMADO + outbox PaymentConfirmed]
  TX1 --> O1[Outbox Worker]
  O1 --> K1[Kafka payments.confirmed]

  G -->|failed| TX2[Postgres Transaction: order PEDIDO_CANCELADO + payment PAGAMENTO_FALHOU + outbox PaymentFailed]
  TX2 --> O2[Outbox Worker]
  O2 --> K2[Kafka payments.failed]

  G -->|timeout or unknown| TX3[Postgres Transaction: order PEDIDO_PENDENTE + payment PAGAMENTO_PENDENTE_VERIFICAÇÃO + outbox PaymentVerificationRequested]
  TX3 --> O3[Outbox Worker]
  O3 --> K3[Kafka payments.verification.requested]

  K3 --> W[Verification Worker]
  W --> R[Redis lock/idempotency]
  R --> Q[Polling the gateway by idempotencyKey or transactionReference]
  Q -->|confirmed| WC[DB + outbox PaymentConfirmed]
  Q -->|rejected or not found| WF[DB + outbox PaymentFailed]
  Q -->|temporary error| RET[Retry with backoff]
  RET -->|limit exceeded| DLQ[Kafka payments.verification.dlq]

  GW[Gateway webhook] --> WH[API POST /payments/webhooks]
  WH --> WHI[Dedup in payment_webhook_events]
  WHI -->|confirmed/failed/unknown| WHTX[DB + outbox PaymentConfirmed, PaymentFailed or PaymentVerificationRequested]

  B[Periodic Reconciliation Job] --> P[Fetch pending payments or payments in RECONCILIAÇÃO_NECESSÁRIA]
  P --> BG[Compare with gateway records]
  BG -->|corrects| BOK[DB + outbox PaymentConfirmed or PaymentFailed]
  BG -->|inconsistent| ALERT[Mark RECONCILIAÇÃO_NECESSÁRIA + outbox payments.reconciliation.needed + metric/log]
```
### Added Observability:

`payment_webhooks_total`, `payment_verification_total`, `payment_verification_retries_total`, `payment_verification_dlq_total`, `payment_reconciliation_total`, and `payment_verification_duration_ms`, as well as `payments.verify` spans and logs containing `correlationId`, `paymentId`, and gateway reference.

> [!IMPORTANT]
> ### Architectural Resilience: Transactional Outbox & Orchestrated Saga
> 
> In highly concurrent event-driven architectures, network partitioning and database failures are inevitable. The **EventMaster** addresses these distributed systems challenges through strict patterns:
> 
> *   **Atomicity via Transactional Outbox:** An API should never emit a message to an external broker (like Kafka) inside an active database transaction. If the transaction fails, a ghost message is sent; if the broker fails, the database rollback leaves the system inconsistent. By persisting `orders`, `payments`, and `outbox_events` in a single Postgres transaction, we guarantee **Exactly-Once processing** boundaries locally.
> *   **Reliability via Orchestrated Saga:** Payment networks often suffer from unpredictable timeouts and transient errors. Instead of blocking the client request (critical path), any inconclusive transaction is offloaded to a background **Verification Worker**. This asynchronous orchestration ensures optimal checkout throughput while maintaining data consistency.

## Core Architectural Components

The architecture is decoupled into specialized components, each isolated by responsibility and scaling strategy.

### Component Overview & Responsibilities

| Component | Technical Stack | Core Responsibility | Resilience & Patterns |
| :--- | :--- | :--- | :--- |
| **API Gateway & Core** | NestJS | Ingress validation and command parsing. | Writes `orders` and `outbox_events` atomically. Zero direct Kafka coupling. |
| **Database Engine** | PostgreSQL | Dual-purpose transactional state storage. | Guarantees Dual-Write isolation via single ACID transactions. Prevents lost events. |
| **Outbox Orchestrator** | Node.js Worker | Event publishing engine. | Polling-publisher pattern, managing network retries and exponential backoff. |
| **Event Backbone** | Apache Kafka | Distributed event streaming. | Partitioning by `orderId` to enforce strict ordering guarantee per entity. |
| **Domain Consumer** | Background Worker| Asynchronous execution of order routines. | Pull-based consumers equipped with structural DLQ fallbacks. |
| **Caching & Identity** | Redis | High-throughput distributed state memory. | Idempotency guard rails to guarantee exactly-once processing behavior. |
| **Infrastructure Scaler**| KEDA | Event-driven Kubernetes auto-scaling. | Scale-to-zero capabilities based natively on Kafka Consumer Group lag. |

---

### Deep Dive: Component Technical Specifications

#### API & Storage Layer
*   **NestJS Core:** Receives all client payload requests and executes upfront validation. It never touches the messaging mesh directly.
*   **PostgreSQL Atomicity:** Implements the *Transactional Outbox Pattern*. Every business mutation and its respective domain event are captured inside the same database block:
    ```ts
    // PostgreSQL Atomicity Guarantee
    await database.transaction(async (tx) => {
      await tx.insert(orders);
      await tx.insert(outbox_events);
    });
    ```

#### Event Routing & Messaging
*   **Outbox Worker:** An isolated process dedicated exclusively to parsing the `outbox_events` table and pushing them forward into Kafka. If Kafka goes down, the system remains operational for checkout.
*   **Apache Kafka Mesh:** Serves as the system event backbone. Topics are segregated by domain bounds (e.g., `orders.created`, `orders.created.DLQ`).
    *   *Routing Key:* Uses `partition_key = orderId` to prevent race conditions during consumer parallelization.

#### Distributed Guard Rails
*   **Redis Idempotency Check:** Protects downstream logic against network duplicate deliveries (at-least-once edge cases).
    ```ts
    // Distributed Lock & Deduplication
    const isUnique = await redis.setnx(`idempotency:${eventId}`, "PROCESSING");
    if (!isUnique) throw new DuplicateEventException();
    ```
*   **KEDA Auto-Scaling:** Controls the infrastructure density dynamically based on live event load metrics instead of static CPU/Memory constraints.
    ```yml
    # KEDA Metric Target Concept
    triggers:
      - type: kafka
        metadata:
          topic: orders.created
          lagThreshold: "10" # Scales up pods when lag increases
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

## Distributed Systems Reliability & Fault Tolerance

The architecture incorporates corporate-grade resilience patterns to handle network partitioning, downstream unavailability, and race conditions without data corruption or loss.

### Resilience Matrix

| Reliability Pattern | Engineering Objective | Mitigation Strategy | Failure Mode Addressed |
| :--- | :--- | :--- | :--- |
| **Transactional Outbox** | Zero Data Loss Guarantee | Atomic DB commits for state + event metadata. | Broker downtime & partial transaction failures. |
| **Distributed Idempotency** | Exactly-Once Processing Semantics | Redis-backed distributed locks and mutation deduplication. | At-Least-Once delivery duplicates and race conditions. |
| **Exponential Backoff** | Self-Healing Integration | Linear/Exponential retries with randomized jitter. | Transient network blips and downstream rate-limiting. |
| **Dead Letter Queue (DLQ)** | Safe Degradation & Isolation | Asynchronous isolation of poisonous or unparseable messages. | Cascade failures and blocked consumer partitions. |
| **Partition Key Routing** | Deterministic Event Ordering | Message routing bound strictly to the Entity ID (`orderId`). | Out-of-order state transitions in multi-threaded environments. |

---

### Technical Deep Dive: Architectural Safeguards

#### Transactional Outbox Pattern
Instead of firing events over the network during a live client request, the system writes the domain events into a local PostgreSQL append-only table within the same database block. This ensures that a business transaction never succeeds without its respective notification event being captured, eliminating the *Dual-Write* anti-pattern.

#### Idempotency Guard Rails via Redis
To combat duplicated deliveries inherent to modern brokers, the consumers use **Redis** as a fast, centralized key-value store to execute a *Check-And-Set* operation. Every incoming payload is validated against a unique transaction identifier before executing any business logic.

#### Resilient Retry Mechanisms & DLQ Fallbacks
When a transient failure occurs (such as a brief database timeout), the consumer does not crash. It triggers a retry loop utilizing **Exponential Backoff with Jitter** to prevent overwhelming the downstream infrastructure (*Thundering Herd Problem*).
*   **Poison Pill Handling:** If a message reaches its maximum retry threshold (e.g., due to a data type mismatch), it is safely routed to a dedicated `.DLQ` topic. This keeps the main pipeline running smoothly without blocking other customers.

#### Deterministic Entity Ordering
By utilizing the `orderId` as the Kafka partition key, the architecture guarantees that all lifecycle mutations for a specific order (e.g., `CREATED` ➡️ `PAID` ➡️ `SHIPPED`) are routed to the exact same partition. This setup ensures strict FIFO sequential processing per entity, even when running dozens of consumer pods concurrently.

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
event-driven-order-processing-system/
├── .github/                         # GitHub Actions / CI workflows
│
├── apps/
│   ├── api/                         # REST API (Producer)
│   ├── worker/                      # Kafka consumer workers
│   ├── outbox-worker/               # Transactional Outbox publisher
│   └── web/                         # Frontend / Web placeholder
│
├── event-driven-order-processing-system-main/
│   ├── .github/workflows/           # CI/CD pipelines
│   │
│   ├── apps/                        # Distributed services
│   ├── docs/                        # Architecture docs & engineering notes
│   │
│   ├── fullstack-system-design-playbook/
│   │   ├── docs/                    # Educational architecture documentation
│   │   ├── src/                     # Frontend source code
│   │   ├── index.html               # Vite entrypoint
│   │   ├── package.json
│   │   ├── tailwind.config.cjs
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── infra/                       # Local infrastructure stack
│   │   ├── docker-compose.yml
│   │   ├── prometheus.yml
│   │   ├── otel-collector.yaml
│   │   └── grafana/
│   │
│   ├── k8s/                         # Kubernetes manifests
│   │
│   ├── mcp/                         # AI observability & MCP gateway
│   │
│   ├── docs/                        # Engineering documentation
│   ├── LICENSE
│   └── README.md
│
├── infra/                           # Shared infrastructure resources
├── k8s/                             # Shared Kubernetes manifests
├── mcp/                             # MCP services / AI tooling
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── LICENSE
```

## Core System Components & Subsystems

The architecture is partitioned into decoupled, specialized subsystems. Each component is engineered to enforce strict separation of concerns, deterministic scaling, and operational isolation.

### Distributed Subsystems Overview

#### API Gateway Layer
The ingress engine of the architecture, responsible for client communication and command parsing.
*   **Edge Capabilities:** Exposes public REST boundaries (e.g., `POST /orders`), executes upfront payload validation, and injects structural metadata (`correlationId`) for distributed tracking.
*   **Storage Boundaries:** Persists core domain states and writes corresponding transaction events directly to the outbox repository.
  > [!IMPORTANT]
  > **Zero Broker Coupling:** To preserve low latency and high availability, the API layer has no network dependencies on Apache Kafka and never publishes events directly to the message mesh.

#### Outbox Orchestrator Worker
An independent background process dedicated exclusively to bridging the relational database state with the distributed streaming backbone.
*   **Publishing Pattern:** Executes high-throughput polling on the append-only outbox table, marshals payload metadata, and pushes messages sequentially into Kafka.
*   **Consistency Frontier:** Implements the *Transactional Outbox Pattern*, acting as the definitive guarantor of atomicity between relational storage mutations and the event stream.

#### Domain Consumer Worker
The asynchronous processing powerhouse of the system, designed to consume data pipelines without degrading user checkout performance.
*   **Pipeline Execution:** Subscribes natively to Apache Kafka topics, handling intensive business domain logic out-of-band.
*   **Defensive Engineering:** Implements strict distributed idempotency checks, local state reconciliation, automated retry mechanisms, and graceful fallbacks via Dead Letter Queues (DLQ).

#### AI Observability Gateway (MCP)
An advanced Model Context Protocol (MCP) abstraction layer designed for modern autonomous operations.
*   **Intelligent Routing:** Acts as a secure, structured gateway that exposes active system signals, live performance metrics, and deep architectural context directly to AI-assisted analytical workflows.

#### Fullstack Systems Design Playbook
The interactive, visual user interface of the ecosystem.
*   **Operational Sandbox:** A frontend orchestration dashboard engineered for live architectural experimentation, visualizing complex patterns such as eventual consistency, active resilience, and telemetry tracing in real-time.

---

### Infrastructure & Production-Grade Orchestration

#### Local Development Topology (Docker Compose)
Provides a fully containerized mirror of production-grade infrastructure on local machines. The stack exposes localized endpoints for:
*   **State & Cache:** PostgreSQL (Persistent transactional engine) and Redis (Distributed high-throughput memory).
*   **Event Mesh:** Apache Kafka (Message infrastructure) and Zookeeper/Kraft metadata managers.
*   **Telemetry Suite:** Prometheus (Metrics collection), Grafana (Dashboarding and alerting), and Jaeger via OpenTelemetry (End-to-end distributed transaction tracing).

#### Cloud Orchestration (Kubernetes)
Contains declarative, production-ready manifests for enterprise cluster environments.
*   **Deployment Topologies:** Manages automated scaling, self-healing pod definitions, network ingress routing, and config mapping for the API, processing workers, database instances, and observability components.

---

### Deep Dive: Transactional Outbox Pattern

To eliminate the hazardous **Dual-Write Anti-Pattern**, where a service tries to persist business state and publish a message at the same time, this architecture moves event publication behind a strict **database-backed transactional boundary**.

```mermaid
flowchart TD

    A[Client Request]

    subgraph Edge Layer
        B[API Ingress Layer]
    end

    subgraph Transaction Boundary
        direction TB
        C[(PostgreSQL<br/>Single ACID Transaction)]
        C1[Persist Order State]
        C2[Append Domain Event<br/>Outbox Ledger]

        C --> C1
        C --> C2
    end

    subgraph Delivery Layer
        D[Outbox Publisher Worker]
    end

    subgraph Streaming Layer
        E[Apache Kafka Event Mesh]
    end

    A -->|HTTP Request| B

    B -->|Commit State + Event Atomically| C

    C2 -->|Committed Event Record| D

    D -->|Asynchronous Polling + Publish| E
```

#### Execution Flow

| Step | Stage | What Happens |
| --- | --- | --- |
| **1** | **Atomic Persistence** | The API persists the order state and appends the domain event into the outbox table inside one local PostgreSQL ACID transaction. |
| **2** | **Deferred Delivery** | After the commit succeeds, the Outbox Publisher Worker polls the outbox ledger and publishes pending events asynchronously. |
| **3** | **Kafka Propagation** | Kafka receives the event as part of the distributed event stream, allowing downstream consumers to react independently. |
| **4** | **Failure Safety** | If Kafka is temporarily unavailable, the event remains safely stored in PostgreSQL and can be retried without losing the business transaction. |

#### Engineering Outcome

| Capability | Impact |
| --- | --- |
| **No Dual Writes** | The system avoids partial success between database writes and broker publishing. |
| **ACID-Protected Events** | Business state and domain events are persisted under the same transactional guarantee. |
| **Resilient Messaging** | Broker outages do not interrupt the customer checkout flow. |
| **Eventual Consistency** | Downstream services converge asynchronously after the local transaction is committed. |
| **Operational Recovery** | Failed publications can be retried from the outbox ledger without manual reconstruction. |

### Key Architectural Benefits

*   **Guaranteed Data Consistency:** Eradicates the split-brain scenario between application state and message streams, achieving strict eventual consistency targets.
*   **Zero Event Loss (RPO = 0):** Domain events are backed by persistent storage durability before network flight, making the system immune to sudden broker crashes.
*   **Safe Reprocessing Semantics:** Enables precise message playback from historical database outbox tables without corrupting downstream active state machines.
*   **Comprehensive Auditability:** Implements an unalterable append-only event ledger directly within the database, providing a transparent forensic trail for all business state mutations.

### DLQ Management & Operational Reprocessing

When an event exceeds its maximum retry threshold due to an unrecoverable failure (e.g., downstream unavailability or payload corruption), it is isolated to prevent pipeline blocking.

*   **Dead Letter Queue (DLQ) Target:** Failsafe events are systematically routed to the dedicated topic:
    ```ts
    orders.created.dlq
    ```
*   **Administrative Recovery Interface:** The system exposes a secure operational endpoint to trigger manual intervention:
    ```ts
    POST /admin/dlq/reprocess
    ```

> [!NOTE]
> **Operational Replay Semantics:** The administrative endpoint allows SRE teams to safely replay failed events into the main processing stream after resolving the root cause, ensuring data completeness without introducing side effects or state duplication.

## Enterprise Observability, Telemetry & Dashboards

The architecture implements a comprehensive production-grade telemetry stack based on OpenTelemetry standards, separating operational metrics, distributed tracking, and dashboarding.

### 1. Metrics & Time-Series Data (Prometheus)

The system exposes specialized Prometheus metrics across all sub-services to track throughput bottlenecks, operational degradation, and database coupling delays.

#### Exposed Metrics Endpoints

| Sub-Service Component | Scraping Port & Endpoint | Target Core Metric Domain |
| :--- | :--- | :--- |
| **Ingress API Gateway** | `http://localhost:3000/metrics` | HTTP Request Latency, Error Rates (4xx/5xx) |
| **Domain Consumer Worker** | `http://localhost:9100/metrics` | Kafka Consumer Lag, Processing Throughput, Poison Pill Rate |
| **Outbox Orchestrator** | `http://localhost:9200/metrics` | Database Polling Latency, Outbox Table Queue Lag |

#### Key Telemetry Signals Tracked:
*   **Event Throughput:** Live measurement of processed messages per second across all Kafka topics.
*   **Processing Failures:** Counter for operational drops and error categorization before DLQ redirection.
*   **Retry Attempts:** Tracks exponential backoff amplification to signal downstream system stress.
*   **Outbox Lag Engine:** Measures the delta between PostgreSQL commit time and Kafka publication confirmation.
*   **In-Flight Computations:** Active gauges tracking memory footprint and parallel thread saturation.

---

### 2. Visualization & Alerting (Grafana)

Operational dashboards are versioned directly within the codebase infrastructure directory, achieving an **Observability-as-Code** pattern.

*   **Dashboard Definition Path:** `infra/grafana/dashboards/`
*   **Visualizations Included:** Live telemetry on end-to-end latency histograms, message processing success/failure ratios, outbox persistence lag tracking, and active consumer scaling status.

---

### 3. Distributed Tracing (OpenTelemetry & Jaeger)

To debug distributed transactions across asynchronous event boundaries, the architecture utilizes OpenTelemetry context propagation.

*   **Jaeger UI Web Console:** `http://localhost:16686`
```mermaid
flowchart TD

    A[Client Request]

    subgraph Edge Layer
        B[API Ingress]
    end

    subgraph Streaming Layer
        C[Apache Kafka Event Mesh]
    end

    subgraph Processing Layer
        D[Domain Worker]
    end

    subgraph Persistence Layer
        E[(PostgreSQL)]
    end

    A -->|HTTP Context| B

    B -->|Trace Context Injection| C

    C -->|Trace Context Extraction| D

    D -->|Transactional Persistence| E
```

> [!TIP]
> **Distributed Lifecycle Trace:** A single unique `correlationId` is injected at the API HTTP gate and propagated natively through Kafka headers. This allows developers to trace the entire lifecycle of a request from **HTTP Kafka Broker Consumer Worker Relational Database Commit** within a single centralized timeline view in Jaeger.

## Progressive Delivery: Canary Release Strategy

The architecture now supports standard Cloud-Native **Canary Release** strategies for the API layer. This enables safe, incremental traffic routing to newer versions before full-scale production deployment.

```mermaid
flowchart TD

    subgraph Edge Layer
        A[Ingress NGINX Router]
    end

    subgraph Stable Environment
        B[API v1.0.0<br/>Stable Production]
    end

    subgraph Canary Environment
        C[API v1.1.0<br/>Canary Testing]
    end

    A -->|90% Production Traffic| B

    A -->|10% Canary Traffic| C
```

### Infrastructure & Canary Verification Stack

The deployment pipeline automates traffic splitting and operational safety using the following ecosystem components:

*   **Weighted Ingress NGINX:** Handles the edge traffic splitting natively within the cluster. It routes a small, controlled percentage of client requests (e.g., 10%) to the canary cohort based on declarative annotation weights.
*   **Version Label Isolation:** Kubernetes deployment manifests isolate workloads using strict `app.kubernetes.io/version` tagging, enabling independent scaling and rollbacks.
*   **Prometheus Metrics per Cohort:** Every HTTP request performance signal (latency, throughput, 5xx error rates) is automatically tagged with its deployment version, allowing instantaneous comparison between stable and canary builds.
*   **OpenTelemetry Trace Tagging:** Distributed spans inside Jaeger carry explicit metadata about the server version running the execution. This isolates and simplifies debugging if a new bug is introduced in the background worker.

> [!TIP]
> **Blast Radius Mitigation:** By rolling out the new API version to a tiny subset of production traffic, any uncaught edge-case exception is isolated. If the Prometheus telemetry signals a spike in the canary error rate, the system can trigger an immediate automated rollback, reducing the failure impact to near zero.

Documentacao operacional:

```ts
docs/canary-release.md
```

## Technology Stack & Ecosystem Architecture

The project ecosystem is built using industry-proven, high-throughput technologies, categorized by architectural layers to ensure scalability and decoupling.

### Technology Blueprint

*   **Application Frameworks:** `Node.js` + `TypeScript` | `NestJS` (Enterprise Ingress API Engine)
*   **Data & Distributed Cache:** `PostgreSQL` (ACID Relational Engine) | `Redis` (High-speed Key-Value Store for Idempotency)
*   **Event Mesh & Streaming:** `Apache Kafka` via `Redpanda` (Cloud-native, fast distributed event backbone)
*   **Observability & Telemetry:** `OpenTelemetry` (Distributed tracing API) | `Jaeger` (Trace visualization) | `Prometheus` (Time-series metrics) | `Grafana` (Dashboarding engine)
*   **Infrastructure & Orchestration:** `Docker` + `Docker Compose` (Local environment parity) | `Kubernetes` (Production-grade container orchestration & Canary routing)

---

## Comprehensive Testing Suite & Quality Assurance

To guarantee system integrity, data atomicity, and event convergence across asynchronous boundaries, the architecture enforces a strict multi-layered testing strategy.

```mermaid
flowchart TB

    subgraph Platform Reliability Tests
        A[E2E / Integration Tests]
        A1[HTTP Gateway]
        A2[Authentication]
        A3[Kafka Contracts]
        A4[Database Persistence]
    end

    subgraph Domain Reliability Tests
        B[Unit Tests]
        B1[Use Cases]
        B2[State Machine]
        B3[Payment Strategies]
        B4[Business Rules]
    end

    A --> A1
    A --> A2
    A --> A3
    A --> A4

    B --> B1
    B --> B2
    B --> B3
    B --> B4
```

### 1. Unit Testing (Domain Isolation)
*   **Objective:** Validates pure business domain rules without database or network I/O dependencies.
*   **Core Targets:** Focuses heavily on the `CreateOrderUseCase` and the `Order` state machine. It ensures correct status transitions (`PENDING` ➡️ `CONFIRMED` / `FAILED`) under various simulated checkout events.
*   **Edge Case Coverage:** Mocks payment gateway responses to test success/failure branches for PIX, credit card, and banking boletos, ensuring invalid methods are caught before database writes.

### 2. Integration & Contract Testing (HTTP Lifecycle)
*   **Objective:** Assures correctness across network, middleware, and database boundaries.
*   **Core Targets:** Uses automated HTTP request testing tools to trigger active controllers.
*   **Safety Assertions:** Validates upfront request payload schemas, authentication guards (JWT parsing), route permission layers, and tests the critical path endpoints like `POST /orders` against real temporary infrastructure state.

> [!TIP]
> **Continuous Quality Signal:** All tests can be executed seamlessly inside isolated containers to replicate production behaviors, ensuring that code changes never impact the **Exactly-Once processing** or **Transactional Outbox** guarantees.
Por que essa reestruturação ficou sênior:Categorização da Stack: Em vez de uma lista crua de tecnologias, dividi-las por responsabilidades (Application Frameworks, Data, Event Mesh...) demonstra que você entende o papel exato de cada ferramenta na engrenagem.Pirâmide/Fluxo de Testes: O pequeno diagrama em formato texto explica a abrangência da sua suíte de testes de forma muito visual e clara.Uso do Redpanda: Destacar que você utiliza o Redpanda (uma alternativa moderna e rápida ao Kafka tradicional) demonstra que você está atualizado com as tendências de mercado de Cloud Native.Agora que passamos por praticamente todas as seções do seu repositório, você gostaria que eu gerasse o Sumário Executivo (Table of Contents) clicável para colocar no topo do seu README e finalizar a organização do portfólio?

## Model Context Protocol (MCP) & Operational Intelligence Gateway

The architecture integrates a secure **Model Context Protocol (MCP)** abstraction layer. This is not a generic "chatbot interface"—it functions as an enterprise-grade **AI Reliability Copilot & Operational Intelligence Layer** designed to bridge the gap between raw cloud-native telemetry and high-level incident response decision-making.

```mermaid
flowchart TD

    A[Operator / Human]

    subgraph AI Operations Layer
        B[Secure MCP Gateway]
    end

    subgraph Security & Compliance Layer
        C[Sanitize Context]
        E[Block PII / Secrets]
    end

    subgraph Observability Intelligence Layer
        D[Query Prometheus]
        F[Analyze Kafka Lag]
    end

    A -->|Natural Language Request| B

    B -->|Enforces Guardrails| C

    B -->|Intent Translation| D

    C --> E

    D --> F
```

### Core Capabilities & Operational Value

*   **Telemetry-to-Intent Translation:** Automatically converts abstract human operational queries (e.g., *"Is the checkout pipeline degrading?"*) into deterministic analytical telemetry validations—evaluating P95 latency histograms, Kafka consumer lag thresholds, event loop saturation, and active retry rates.
*   **Secure Operational Boundaries:** Enforces strict enterprise execution limits. The autonomous layer interacts *only* with whitelisted metric endpoints and sanitized read-only tools. It blocks destructive payloads, raw SQL queries, stack traces, PII (Personally Identifiable Information), and infrastructure secrets.
*   **Explainable Operations & Blast Radius Analysis:** Translates raw numerical noise (`p95 = 740ms`) into contextualized client impact assessments (*"Customers are experiencing checkout delays, but distributed idempotency guardrails are preventing duplicate billing clones"*).
*   **Cognitive Load Reduction:** Automates guided incident diagnostics, ticket deflection workflows, and multi-signal telemetry correlations, lowering the operational pressure during production incidents.

---

## Local Deployment & Setup Flow

Follow the step-by-step sequence below to orchestrate the infrastructure, run the distributed microservices, and activate the operational intelligence layer.

### 1. Environment Initialization
Clone the configuration boilerplate and configure the core infrastructure network connection variables.

```bash
cp .env.example .env
```

Ensure your `.env` contains the default distributed connectivity endpoints:
```bash
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/minishop
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
KAFKA_BROKER=localhost:9092
```
> [!NOTE]
> `KAFKA_BROKERS` is the architectural standard variable. `KAFKA_BROKER` is maintained exclusively as a backward-compatible alias for legacy automation scripts and localized consumers.

### 2. Orchestration Sequence

Execute the runtime components in the exact deterministic order below to ensure data schema consistency and avoid runtime connection failures.

| Step | Execution Directive | Operational Subsystem / Action | Objective |
| :--- | :--- | :--- | :--- |
| **1** | `pnpm infra:up` | Infrastructure Stack (Docker Compose) | Boots PostgreSQL, Redis, Kafka, Prometheus, and Jaeger meshes. |
| **2** | `pnpm db:migrate` | Relational Migration Pipeline | Applies the relational database DDL schema. |
| **3** | `pnpm -C apps/api start:dev` | Ingress API Gateway | Launches the public HTTP boundary (`:3000/healthz`). |
| **4** | `pnpm -C apps/outbox-worker dev`| Outbox Orchestrator | Activates the PostgreSQL-to-Kafka transactional polling engine. |
| **5** | `pnpm -C apps/worker start:dev` | Domain Consumer Worker | Runs the asynchronous Kafka stream processing worker. |
| **6** | `pnpm -C mcp dev` | MCP Gateway Runtime | Starts the Secure AI Observability Interface. |

> [!TIP]
> **Idempotent DB Init:** PostgreSQL automatically mounts the internal `/infra/sql` path into `/docker-entrypoint-initdb.d` during the initial volume boot. The manual `pnpm db:migrate` execution step is enforced as an idempotent safeguard to protect existing local development volumes from missing critical entities (such as the `outbox_events` table).

#### Launching the Educational UI
To interact with the frontend simulation lab, navigate to the sibling architecture manual directory:
```bash
cd ../fullstack-system-design-playbook
pnpm dev
```

---

## Production-Grade Kubernetes Orchestration

To transition from local development parity into automated cluster orchestration, deploy the infrastructure manifests and event-driven horizontal auto-scalers.

### Workload Deployment
```bash
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/worker-keda.yaml
```

### Cluster Health Verification
Monitor deployment density, inspect background consumer trace structures, and validate the active metric thresholds of the event scaling objects:
```bash
# Audit active pod scheduling across the specialized namespace
kubectl get pods -n minishop

# Stream localized container runtime execution logs
kubectl logs -n minishop deployment/worker

# Verify KEDA scale-to-zero capabilities based on active Kafka group lag
kubectl get scaledobject -n minishop
```

## Architectural Trade-offs & Design Decisions

Every technology chosen for the **EventMaster** ecosystem addresses a specific distributed computing challenge, ensuring strict adherence to the *Fallacies of Distributed Computing* mitigation strategies.

### Technical Rationale Matrix

*   **The Outbox Imperative:** Traditional dual-writes (simultaneously updating a database and firing a message broker event) introduce split-brain risks when network partitions occur. The Transactional Outbox pattern guarantees that system mutations and event logs are atomically bound, achieving an absolute zero-event-loss architecture.
*   **The Kafka Messaging Backbone:** By decoupling ingress throughput from background execution capacity, Apache Kafka provides durable event streaming, multi-consumer broadcast semantics, and strict partitioning guarantees bound to the entity lifecycle.
*   **The Redis Deduplication Guard:** In modern message meshes, *At-Least-Once* delivery is the realistic standard. Redis acts as a ultra-low latency distributed memory guard rail, tracking idempotency keys to completely eliminate duplicate computation clones and race conditions.
*   **The KEDA Dynamic Scaler:** Traditional CPU/Memory HPA (Horizontal Pod Autoscaler) metrics are lagging indicators during event spikes. KEDA allows the infrastructure density to adapt instantly based on live Kafka queue lag, providing scale-to-zero efficiency and optimized cloud cost governance.

---

## Real-World Engineering Relevance & Framework Mirroring

This implementation is not a conceptual toy project. The architectural blueprints, failure mitigations, and operational patterns built here directly mirror the core platform infrastructures powering the world’s leading software ecosystems:
*   **Stripe Engineering:** Modeled after their deterministic asynchronous event processing pipelines and transaction atomicity invariants.
*   **Uber Core Platform:** Inspired by their decoupled background worker topographies and dead-letter queue (DLQ) automated replay semantics.
*   **Shopify Core:** Reflects their high-volume order ingestion mechanics and eventual consistency reconciliation lifecycles.

### Architectural Proficiencies Demonstrated:
1. Advanced Event-Driven Microservices Design
2. Production-Grade Reliability, Fault Isolation & Resilience Patterns
3. Cloud-Native Elastic Orchestration & Automated Autoscaling (Kubernetes + KEDA)
4. Full-Stack End-to-End Distributed Telemetry (OpenTelemetry, Prometheus, Jaeger, Grafana)
5. Autonomous AI System Introspection & Telemetry-to-Intent Abstraction Layer (MCP)

---

## Future Strategic Architecture Roadmap

To push the frontiers of this ecosystem even further, the upcoming operational milestones include:

- [ ] **GitOps Continuous Delivery:** Implementation of declarative GitOps delivery models using GitHub Actions coupled with ArgoCD or Flux into live Kubernetes clusters.
- [ ] **Enterprise Packaging (Helm):** Engineering structured Helm Charts to simplify environmental parameterization, configuration mapping, and cluster deployment portability.
- [ ] **Native Event Mesh (Strimzi):** Migrating the internal message layer into a fully stateful Kafka cluster managed inside Kubernetes via the Strimzi Operator.
- [ ] **Multi-Region Cross-Replication:** Introducing active-passive or active-active global persistence states across separate cloud availability zones.
- [ ] **Autonomous AI Remediation (SRE Agent):** Upgrading the MCP gateway from a read-only telemetry interface into an active execution agent capable of automated incident containment, trace debugging, and log-driven rollbacks.

---

## Author & System Architect

**Thiago Reis Lima**  
*Software Engineer & AI Systems Builder*  
> Deeply focused on architecting scalable distributed platforms, cloud-native automation meshes, and modern AI operational systems.

[![LinkedIn](https://shields.io)](https://linkedin.com)
[![GitHub](https://shields.io)](https://github.com)

---

### Definitive Note
This repository stands as a production-inspired system design case study. It showcases exactly how modern, high-throughput, and hyper-resilient distributed software platforms are engineered, monitored, and operated in the real world.
