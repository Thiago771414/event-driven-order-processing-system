# MiniShop Observability MCP

Server MCP demonstrativo para o Console de Operacoes com IA do MiniShop.

O assistente nao recebe acesso direto a Prometheus, Kafka, Jaeger, DLQ, shell,
arquivos, segredos ou SQL. Toda investigacao passa por ferramentas seguras,
agregadas e com parametros estreitos.

Na segunda etapa, o mesmo gateway tambem alimenta a Trust & Experience Layer:
metricas tecnicas sao devolvidas com interpretacao de confianca, previsibilidade,
transparencia e impacto operacional ao cliente.

## Ferramentas permitidas

- `queryPrometheusMetrics`
- `getKafkaLag`
- `getDLQStats`
- `getTraceSummary`
- `getCanaryHealth`
- `getWorkerHealth`
- `getRetryMetrics`
- `getPublicSystemStatus`

## Capacidades bloqueadas

- SQL bruto
- acesso ao sistema de arquivos
- comandos arbitrarios de shell
- segredos
- variaveis de ambiente
- consultas irrestritas
- PII
- headers internos
- stack traces
- payloads brutos de mensagens

Se uma solicitacao tentar injecao, exfiltracao, acesso interno ou bypass de
politica, a resposta e:

```text
Access denied by operational security policy.
```

## Protecoes

- allowlist explicita de ferramentas
- validacao de parametros com Zod
- denylist de payloads perigosos
- sanitizacao recursiva de respostas
- rate limiting simples por ferramenta
- protecoes inspiradas em OWASP Top 10 para injection, acesso quebrado,
  exposicao de dados sensiveis e SSRF

## Scripts

```bash
pnpm build
pnpm dev
```
