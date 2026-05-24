import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const PROM_BASE = process.env.PROMETHEUS_URL ?? "http://localhost:9090";

async function promGet(path: string, params?: Record<string, string>) {
  const url = new URL(path, PROM_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Prometheus HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = new McpServer({
  name: "minishop-observability-mcp",
  version: "0.1.0",
});

server.tool(
  "prom_query",
  "Executa uma query PromQL no Prometheus (/api/v1/query).",
  {
    query: z.string().min(1),
    time: z.string().optional(), // unix ou RFC3339 (Prometheus aceita ambos em vários cenários)
  },
  async ({ query, time }) => {
    const json = await promGet("/api/v1/query", time ? { query, time } : { query });
    return {
      content: [{ type: "text", text: JSON.stringify(json, null, 2) }],
    };
  },
);

server.tool(
  "prom_targets",
  "Lista targets do Prometheus (/api/v1/targets).",
  {},
  async () => {
    const json = await promGet("/api/v1/targets");
    return {
      content: [{ type: "text", text: JSON.stringify(json, null, 2) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});