## 🚀 MiniShop — Event-Driven Distributed System (Production-Grade Case)

Case profissional de engenharia distribuída com Kafka, Outbox Pattern, Observabilidade completa, Kubernetes manifests e integração com AI tooling (MCP).

Este repositório demonstra uma arquitetura event-driven pronta para produção, inspirada em sistemas reais de empresas de grande porte.

O foco do projeto é:

confiabilidade

rastreabilidade

idempotência

observabilidade

processamento assíncrono seguro

separação de responsabilidades

deploy cloud-ready

---

## 🎯 Objetivo

Demonstrar, de forma prática, como construir um sistema distribuído com:

✅ API desacoplada do processamento
✅ Worker assíncrono Kafka
✅ Outbox Pattern para consistência
✅ DLQ + reprocessamento manual
✅ Métricas Prometheus
✅ Tracing distribuído (Jaeger)
✅ Kubernetes manifests
✅ MCP (AI tooling para observabilidade)

Este projeto simula decisões reais de arquitetura adotadas em produção.

---

##🧠 Visão geral da arquitetura
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
Processamento idempotente
  ↓
Redis + PostgreSQL
```
Observabilidade:
```ts
Prometheus ← metrics
Grafana ← dashboards
Jaeger ← traces
MCP server ← AI diagnostics
```
---

## 1️⃣ Estrutura final do repositório
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
---

## 🧠 Visão geral da arquitetura

- **API**
  - Expõe endpoint REST (`POST /orders`)
  - Valida payload de entrada
  - Publica eventos no Kafka
- **Worker**
  - Não expõe HTTP
  - Consome eventos Kafka
  - Garante idempotência
  - Processa pedidos
  - Publica eventos de saída
 
---

## ⚙️ Componentes principais

API
REST endpoints
grava pedidos no DB
grava eventos no outbox
NÃO publica Kafka diretamente
correlação e idempotência
Worker
Kafka consumer
idempotência garantida
retry + DLQ
métricas de processamento
Outbox Worker
polling do banco
publica eventos no Kafka
garante consistência transacional
métricas específicas do outbox

---

## 📦 Outbox Pattern

A API grava:
pedido
evento
transaction commit
O outbox-worker publica depois.

Benefícios:
✅ consistência garantida
✅ zero perda de evento
✅ reprocessamento seguro
✅ auditabilidade

---

## 🔄 DLQ + Reprocessamento

Eventos que falham vão para:
```ts
orders.created.dlq
```
A API possui endpoint administrativo:
```ts
POST /admin/dlq/reprocess
```

Permite replay manual controlado.

---

## 📊 Observabilidade

Métricas Prometheus

throughput de eventos

falhas

retries

outbox lag

eventos em voo

Endpoints:

```ts
API:            :3000/metrics
Worker:         :9100/metrics
Outbox Worker:  :9200/metrics
```
---

## Grafana Dashboard

Dashboards versionados em:
```ts
infra/grafana/dashboards/
```

Inclui:

taxa de eventos

falhas

lag do outbox

latência
  
---

## Tracing distribuído

OpenTelemetry + Jaeger
```ts
http://localhost:16686
```
Rastreia:
```ts
HTTP → Kafka → Worker → DB
```

---

## 🤖 MCP (AI Tooling)

Servidor MCP permite que LLMs consultem:

Prometheus

métricas

targets

observabilidade

Exemplo:

AI pode diagnosticar falhas automaticamente.

Diretório:
```ts
/mcp
```
---

## 🧪 Testes

unitários

integração

---

## 🛠️ Stack

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
  
---

## ▶️ Executar local

Subir infraestrutura:
```ts
pnpm infra:up
```
Rodar API:
```ts
pnpm -C apps/api start:dev
```
Rodar worker:
```ts
pnpm -C apps/worker start:dev
```
Rodar outbox worker:
```ts
pnpm -C apps/outbox-worker start:dev
```
Rodar MCP:
```ts
pnpm -C mcp dev
```

---

## ☸️ Kubernetes

Manifests prontos em:
```ts
/k8s
```

Deploy:
```ts
kubectl apply -k k8s/
```
---

---

## 🚀 Evoluções possíveis

GKE deploy

CI/CD GitHub Actions

Apigee gateway

Feature flags

BFF

arquitetura hexagonal

circuit breaker

chaos testing

---

## 👤 Autor - Thiago Reis Lima

Case profissional de engenharia distribuída

---
