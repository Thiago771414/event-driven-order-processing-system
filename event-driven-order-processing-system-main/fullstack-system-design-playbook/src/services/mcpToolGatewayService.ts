import { aiOpsConsoleMock } from '../mocks/aiOpsMock';
import type {
  CanaryAnalysis,
  DlqSnapshot,
  McpToolCall,
  McpToolName,
  WorkerHealthSnapshot,
} from '../types/aiOps';

interface PromptInspectionResult {
  allowed: boolean;
  reason: string;
}

interface SafeToolInvocation<T> {
  call: McpToolCall;
  data: T;
}

const allowedTools = new Set<McpToolName>(aiOpsConsoleMock.controlPlane.allowedTools);

const forbiddenPromptPatterns = [
  /ignore (as )?(instrucoes|instructions|policy|policies)/i,
  /bypass|jailbreak|developer mode|sem politica|sem seguranca/i,
  /system prompt|prompt interno|reveal prompt|mostre o prompt/i,
  /raw sql|select\s+.*\s+from|drop table|insert into|delete from/i,
  /powershell|cmd\.exe|bash|shell|comando arbitrario|executa comando/i,
  /filesystem|sistema de arquivos|ler arquivo|arquivo secreto/i,
  /secret|segredo|password|senha|token|api key|environment|variavel de ambiente/i,
];

function buildAllowedCall(
  tool: McpToolName,
  purpose: string,
  summary: string,
  durationMs: number,
): McpToolCall {
  return {
    id: `${tool}-${durationMs}`,
    tool,
    status: 'allowed',
    durationMs,
    policy: 'allowlist + safe parameter schema',
    purpose,
    summary,
  };
}

function buildDeniedCall(tool: McpToolName, purpose: string, summary: string): McpToolCall {
  return {
    id: `${tool}-denied`,
    tool,
    status: 'denied',
    durationMs: 0,
    policy: 'deny-by-default',
    purpose,
    summary,
  };
}

export const mcpToolGatewayService = {
  inspectPrompt(prompt: string): PromptInspectionResult {
    const matchedPattern = forbiddenPromptPatterns.find((pattern) =>
      pattern.test(prompt),
    );

    if (matchedPattern) {
      return {
        allowed: false,
        reason:
          'Solicitacao bloqueada por conter tentativa de bypass, acesso sensivel ou ferramenta proibida.',
      };
    }

    return {
      allowed: true,
      reason: 'Prompt aceito para traducao segura em ferramentas MCP observaveis.',
    };
  },

  deniedToolCall(purpose: string): McpToolCall {
    return buildDeniedCall(
      'getPublicSystemStatus',
      purpose,
      'Nenhuma ferramenta foi executada porque a politica bloqueou a solicitacao.',
    );
  },

  queryPrometheusMetrics(purpose: string): SafeToolInvocation<typeof aiOpsConsoleMock.metrics> {
    const tool: McpToolName = 'queryPrometheusMetrics';
    if (!allowedTools.has(tool)) {
      return {
        call: buildDeniedCall(tool, purpose, 'Ferramenta fora da allowlist MCP.'),
        data: [],
      };
    }

    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Metricas Prometheus traduzidas por familias aprovadas: API, event loop, CPU e retry.',
        42,
      ),
      data: aiOpsConsoleMock.metrics,
    };
  },

  getKafkaLag(purpose: string): SafeToolInvocation<typeof aiOpsConsoleMock.kafkaFlow> {
    const tool: McpToolName = 'getKafkaLag';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Lag e consumer group retornados sem acesso direto ao broker.',
        31,
      ),
      data: aiOpsConsoleMock.kafkaFlow,
    };
  },

  getDLQStats(purpose: string): SafeToolInvocation<DlqSnapshot> {
    const tool: McpToolName = 'getDLQStats';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Resumo agregado da DLQ sem payload sensivel de mensagem.',
        27,
      ),
      data: aiOpsConsoleMock.dlq,
    };
  },

  getTraceSummary(purpose: string): SafeToolInvocation<typeof aiOpsConsoleMock.traceTimeline> {
    const tool: McpToolName = 'getTraceSummary';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Traces sumarizados por servico, operacao e duracao sem logs brutos.',
        39,
      ),
      data: aiOpsConsoleMock.traceTimeline,
    };
  },

  getCanaryHealth(purpose: string): SafeToolInvocation<CanaryAnalysis> {
    const tool: McpToolName = 'getCanaryHealth';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Saude do canary consolidada por erro, latencia, retry e DLQ.',
        34,
      ),
      data: aiOpsConsoleMock.canary,
    };
  },

  getWorkerHealth(purpose: string): SafeToolInvocation<WorkerHealthSnapshot[]> {
    const tool: McpToolName = 'getWorkerHealth';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Workers avaliados por CPU, event loop lag, queue depth e concurrency.',
        29,
      ),
      data: aiOpsConsoleMock.workerHealth,
    };
  },

  getRetryMetrics(purpose: string): SafeToolInvocation<typeof aiOpsConsoleMock.retryInsights> {
    const tool: McpToolName = 'getRetryMetrics';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Retries e idempotencia agregados sem expor chaves ou payloads.',
        26,
      ),
      data: aiOpsConsoleMock.retryInsights,
    };
  },

  getPublicSystemStatus(purpose: string): SafeToolInvocation<typeof aiOpsConsoleMock.healthNodes> {
    const tool: McpToolName = 'getPublicSystemStatus';
    return {
      call: buildAllowedCall(
        tool,
        purpose,
        'Health publico consolidado de API, Kafka, workers, Redis e dependencias.',
        22,
      ),
      data: aiOpsConsoleMock.healthNodes,
    };
  },
};
