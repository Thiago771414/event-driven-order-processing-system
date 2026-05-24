import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ACCESS_DENIED = "Access denied by operational security policy.";

const allowedToolNames = new Set([
  "queryPrometheusMetrics",
  "getKafkaLag",
  "getDLQStats",
  "getTraceSummary",
  "getCanaryHealth",
  "getWorkerHealth",
  "getRetryMetrics",
  "getPublicSystemStatus",
]);

const deniedCapabilities = [
  "raw SQL",
  "filesystem access",
  "arbitrary shell",
  "secrets",
  "environment variables",
  "unrestricted queries",
  "PII",
  "internal headers",
  "stack traces",
  "raw message payloads",
];

const dangerousPayloadPatterns = [
  /union\s+select/i,
  /\bor\s+1\s*=\s*1\b/i,
  /drop\s+table|insert\s+into|delete\s+from|information_schema/i,
  /ignore\s+(all\s+)?(previous|security|policy|instructions)/i,
  /bypass|jailbreak|developer\s+mode|system\s+prompt/i,
  /exfiltrate|secret|password|token|api[_-]?key|authorization/i,
  /process\.env|environment\s+variable|\.env\b/i,
  /\/etc\/passwd|filesystem|read\s+file|shell|powershell|cmd\.exe|bash/i,
  /stack\s+trace|internal\s+header|x-internal|cookie/i,
  /ssrf|metadata\.google|169\.254\.169\.254/i,
];

const sensitiveKeyPattern =
  /email|phone|cpf|ssn|address|authorization|cookie|token|secret|password|stack|headers|payload|pii/i;

const rateLimitState = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_CALLS = 30;

const publicStatus = {
  status: "degraded",
  reliabilityScore: 92,
  trustScore: 91,
  summary:
    "Checkout is operational with controlled degradation. API p95 and payment latency are elevated; Kafka, Redis, Postgres, and workers are healthy.",
  customerReliability:
    "Customer impact is low to moderate. Proactive payment verification messaging is recommended.",
  endpoints: {
    health: "http://localhost:3000/healthz",
    prometheus: "http://localhost:9090",
    grafana: "http://localhost:3001",
    jaeger: "http://localhost:16686",
    redpanda: "http://localhost:8085",
  },
};

const prometheusFamilies = {
  api_latency: {
    metricFamily: "api_latency",
    safeQueryId: "http_server_duration_p95",
    value: "188 ms",
    baseline: "142 ms",
    trustImpact: "Customers may notice payment confirmation taking longer.",
    interpretation: "API p95 is elevated but below rollback threshold.",
  },
  event_loop: {
    metricFamily: "event_loop",
    safeQueryId: "nodejs_eventloop_lag_seconds",
    value: "47 ms",
    baseline: "31 ms",
    trustImpact: "Runtime lag is not high enough to create visible checkout failure.",
    interpretation: "Runtime lag is visible but not severe.",
  },
  cpu: {
    metricFamily: "cpu",
    safeQueryId: "rate_process_cpu_seconds_total",
    value: "62%",
    baseline: "55%",
    trustImpact: "Worker capacity is adequate for current customer demand.",
    interpretation: "Worker CPU is moderate and not saturated.",
  },
  retry_rate: {
    metricFamily: "retry_rate",
    safeQueryId: "checkout_retry_rate",
    value: "1.9%",
    baseline: "1.1%",
    trustImpact: "Idempotency keeps duplicate-order anxiety low.",
    interpretation: "Retry rate increased after payment timeouts.",
  },
};

const kafkaLag = {
  topic: "minishop.checkout.events",
  consumerGroup: "checkout-workers",
  partitions: 6,
  lagMessages: 42,
  trend: "falling",
  trustImpact: "Order status updates remain predictable.",
  interpretation: "Backlog is clearing and does not indicate worker saturation.",
};

const dlqStats = {
  queue: "minishop.checkout.events.dlq",
  openMessages: 2,
  oldestAge: "11 min",
  dominantReason: "payment gateway timeout after retry budget",
  replaySafety: "safe with idempotency key and manual approval",
  trustImpact:
    "A very small number of orders may require manual verification; proactive support notes are enough.",
};

const traceSummary = {
  traceId: "trace-8f42",
  criticalPath: [
    { service: "api", operation: "POST /orders", duration: "188 ms" },
    { service: "orders", operation: "commit order + outbox", duration: "48 ms" },
    { service: "outbox-worker", operation: "publish checkout event", duration: "91 ms" },
    { service: "checkout-worker", operation: "authorize payment", duration: "740 ms" },
  ],
  customerReliabilitySummary:
    "The checkout journey is intact; payment authorization creates the largest wait.",
  rootCauseHypothesis:
    "The payment authorization span dominates tail latency; database and outbox spans are healthy.",
};

const canaryHealth = {
  release: "api-checkout-v2",
  trafficShare: "5%",
  reliabilityScore: 86,
  trustGate: "hold",
  decision: "hold",
  customerReliabilitySummary:
    "Holding canary protects customers from a wider latency regression.",
  riskFactors: {
    errorBudget: "99.82%",
    latencyDelta: "+17%",
    retryDelta: "+0.4%",
    dlqDelta: "+1 event",
  },
};

const workerHealth = {
  pool: "checkout-workers",
  aggregate: {
    status: "healthy",
    cpu: "62%",
    eventLoopLag: "36 ms",
    queueDepth: 31,
    concurrency: "25/32",
  },
  trustImpact: "Workers are not currently a customer-visible bottleneck.",
  workers: [
    { name: "checkout-worker-a", cpu: "58%", eventLoopLag: "31 ms", queueDepth: 14 },
    { name: "checkout-worker-b", cpu: "63%", eventLoopLag: "36 ms", queueDepth: 17 },
    { name: "outbox-publisher", cpu: "67%", eventLoopLag: "54 ms", queueDepth: 12 },
  ],
};

const retryMetrics = {
  retryRate: "1.9%",
  idempotencyHitRate: "18%",
  replayWindow: "24 h",
  duplicateOrderRisk: "low",
  trustImpact:
    "Customers should not see duplicated orders; proactive copy can reduce anxiety.",
  interpretation:
    "Retries increased slightly, but idempotency coverage is preventing duplicate side effects.",
};

function deniedResponse() {
  return {
    content: [
      {
        type: "text" as const,
        text: ACCESS_DENIED,
      },
    ],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsDangerousPayload(value: unknown): boolean {
  if (typeof value === "string") {
    return dangerousPayloadPatterns.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some(containsDangerousPayload);
  }

  if (isObject(value)) {
    return Object.entries(value).some(
      ([key, nestedValue]) =>
        sensitiveKeyPattern.test(key) || containsDangerousPayload(nestedValue),
    );
  }

  return false;
}

function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const current = rateLimitState.get(toolName);

  if (!current || current.resetAt <= now) {
    rateLimitState.set(toolName, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_CALLS) {
    return false;
  }

  current.count += 1;
  return true;
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    if (dangerousPayloadPatterns.some((pattern) => pattern.test(value))) {
      return "[redacted]";
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[redacted]" : sanitize(nestedValue),
      ]),
    );
  }

  return value;
}

function toolResponse(toolName: string, input: unknown, payload: unknown) {
  if (!allowedToolNames.has(toolName) || containsDangerousPayload(input)) {
    return deniedResponse();
  }

  if (!checkRateLimit(toolName)) {
    return deniedResponse();
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            policy: {
              mode: "deny-by-default",
              promptFirewall: "enabled",
              allowedToolOnly: true,
              queryValidation: "zod schema + semantic allowlist",
              responseSanitization: "recursive redaction enabled",
              rateLimit: `${RATE_LIMIT_MAX_CALLS}/minute/tool`,
              owaspTop10:
                "input validation, access control, sensitive data exposure, SSRF and injection protections",
              deniedCapabilities,
            },
            data: sanitize(payload),
          },
          null,
          2,
        ),
      },
    ],
  };
}

const server = new McpServer({
  name: "minishop-observability-mcp",
  version: "0.3.0",
});

server.tool(
  "queryPrometheusMetrics",
  "Returns whitelisted Prometheus metric families. Raw PromQL is not accepted.",
  {
    metricFamily: z.enum(["api_latency", "event_loop", "cpu", "retry_rate"]),
    window: z.enum(["1m", "5m", "15m"]).optional(),
  },
  async (input) =>
    toolResponse("queryPrometheusMetrics", input, {
      ...prometheusFamilies[input.metricFamily],
      window: input.window ?? "5m",
    }),
);

server.tool(
  "getKafkaLag",
  "Returns aggregated Kafka lag for approved MiniShop topics.",
  {
    topic: z.enum(["minishop.checkout.events"]).optional(),
  },
  async (input) => toolResponse("getKafkaLag", input, kafkaLag),
);

server.tool(
  "getDLQStats",
  "Returns DLQ aggregates without exposing raw message payloads.",
  {
    queue: z.enum(["minishop.checkout.events.dlq"]).optional(),
  },
  async (input) => toolResponse("getDLQStats", input, dlqStats),
);

server.tool(
  "getTraceSummary",
  "Returns a sanitized distributed trace summary without raw logs or secrets.",
  {
    correlationId: z.string().min(3).max(80).optional(),
  },
  async (input) =>
    toolResponse("getTraceSummary", input, {
      ...traceSummary,
      correlationId: input.correlationId ?? "corr-checkout-42",
    }),
);

server.tool(
  "getCanaryHealth",
  "Returns aggregate canary health and a promotion recommendation.",
  {
    release: z.enum(["api-checkout-v2"]).optional(),
  },
  async (input) => toolResponse("getCanaryHealth", input, canaryHealth),
);

server.tool(
  "getWorkerHealth",
  "Returns aggregated worker saturation and queue health.",
  {
    workerPool: z.enum(["checkout-workers", "outbox-publisher"]).optional(),
  },
  async (input) =>
    toolResponse("getWorkerHealth", input, {
      ...workerHealth,
      requestedPool: input.workerPool ?? "checkout-workers",
    }),
);

server.tool(
  "getRetryMetrics",
  "Returns retry and idempotency aggregates without exposing idempotency keys.",
  {
    scope: z.enum(["checkout", "payment"]).optional(),
  },
  async (input) =>
    toolResponse("getRetryMetrics", input, {
      ...retryMetrics,
      scope: input.scope ?? "checkout",
    }),
);

server.tool(
  "getPublicSystemStatus",
  "Returns public system health suitable for load balancers, probes, AI summaries, and Trust Operations.",
  {},
  async (input) => toolResponse("getPublicSystemStatus", input, publicStatus),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
