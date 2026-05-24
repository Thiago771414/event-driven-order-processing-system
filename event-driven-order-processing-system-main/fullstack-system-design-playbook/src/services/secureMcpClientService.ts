import type { McpToolCall, McpToolName } from '../types/aiOps';
import { mcpToolGatewayService } from './mcpToolGatewayService';

export interface SecureMcpRequest {
  tool: McpToolName;
  purpose: string;
}

export interface SecureMcpBatchResult {
  allowed: boolean;
  reason: string;
  toolCalls: McpToolCall[];
}

const dangerousPayloadPatterns = [
  /union\s+select|or\s+1\s*=\s*1|drop\s+table|information_schema/i,
  /ignore\s+(all\s+)?(previous|security|policy|instructions)/i,
  /exfiltrate|token|secret|password|api[_-]?key/i,
  /stack trace|internal header|x-internal|authorization:/i,
  /\/etc\/passwd|\.env|process\.env|filesystem/i,
];

function containsDangerousPayload(value: string) {
  return dangerousPayloadPatterns.some((pattern) => pattern.test(value));
}

function runTool(request: SecureMcpRequest): McpToolCall {
  if (request.tool === 'queryPrometheusMetrics') {
    return mcpToolGatewayService.queryPrometheusMetrics(request.purpose).call;
  }

  if (request.tool === 'getKafkaLag') {
    return mcpToolGatewayService.getKafkaLag(request.purpose).call;
  }

  if (request.tool === 'getDLQStats') {
    return mcpToolGatewayService.getDLQStats(request.purpose).call;
  }

  if (request.tool === 'getTraceSummary') {
    return mcpToolGatewayService.getTraceSummary(request.purpose).call;
  }

  if (request.tool === 'getCanaryHealth') {
    return mcpToolGatewayService.getCanaryHealth(request.purpose).call;
  }

  if (request.tool === 'getWorkerHealth') {
    return mcpToolGatewayService.getWorkerHealth(request.purpose).call;
  }

  if (request.tool === 'getRetryMetrics') {
    return mcpToolGatewayService.getRetryMetrics(request.purpose).call;
  }

  return mcpToolGatewayService.getPublicSystemStatus(request.purpose).call;
}

export const secureMcpClientService = {
  executeBatch(prompt: string, requests: SecureMcpRequest[]): SecureMcpBatchResult {
    const inspection = mcpToolGatewayService.inspectPrompt(prompt);

    if (!inspection.allowed || containsDangerousPayload(prompt)) {
      return {
        allowed: false,
        reason: 'Access denied by operational security policy.',
        toolCalls: [
          mcpToolGatewayService.deniedToolCall(
            'Reject unsafe Trust Operations request before tool execution.',
          ),
        ],
      };
    }

    return {
      allowed: true,
      reason: 'Request translated into safe MCP observability tools.',
      toolCalls: requests.map(runTool),
    };
  },
};
