# MiniShop Observability MCP

A demonstration MCP server for the MiniShop AI Operations Console.

The assistant does not receive direct access to Prometheus, Kafka, Jaeger, the DLQ, the shell,
files, secrets, or SQL. All investigation goes through safe tools that return
aggregated data and accept narrowly scoped parameters.

In the second stage, the same gateway also supports the Trust & Experience Layer:
technical metrics are returned with interpretations of trust, predictability,
transparency, and operational impact on customers.

## Allowed Tools

- `queryPrometheusMetrics`
- `getKafkaLag`
- `getDLQStats`
- `getTraceSummary`
- `getCanaryHealth`
- `getWorkerHealth`
- `getRetryMetrics`
- `getPublicSystemStatus`

## Blocked Capabilities

- raw SQL
- filesystem access
- arbitrary shell commands
- secrets
- environment variables
- unrestricted queries
- PII
- internal headers
- stack traces
- raw message payloads

If a request attempts injection, exfiltration, internal access, or a policy
bypass, the response is:

```text
Access denied by operational security policy.
```

## Safeguards

- explicit tool allowlist
- parameter validation with Zod
- denylist of dangerous payloads
- recursive response sanitization
- simple per-tool rate limiting
- safeguards inspired by the OWASP Top 10 against injection, broken access control,
  sensitive data exposure, and SSRF

## Scripts

```bash
pnpm build
pnpm dev
```
