import { trustOperationsMock } from '../mocks/trustOperationsMock';
import type { McpToolName } from '../types/aiOps';
import type {
  TrustAssistantMessage,
  TrustMetric,
  TrustOperationsSnapshot,
} from '../types/trust';
import { secureMcpClientService, type SecureMcpRequest } from './secureMcpClientService';

type TrustIntent =
  | 'customer-impact'
  | 'proactive-communication'
  | 'ticket-pressure'
  | 'canary-trust'
  | 'general';

let trustMessageCounter = 0;

function nextTrustMessageId(prefix: string) {
  trustMessageCounter += 1;
  return `${prefix}-${trustMessageCounter}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getClock() {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function classifyIntent(question: string): TrustIntent {
  const text = normalize(question);

  if (text.includes('cliente') || text.includes('impacto') || text.includes('percebe')) {
    return 'customer-impact';
  }

  if (text.includes('comunic') || text.includes('transpar') || text.includes('enviar')) {
    return 'proactive-communication';
  }

  if (text.includes('ticket') || text.includes('suporte') || text.includes('sla pressure')) {
    return 'ticket-pressure';
  }

  if (text.includes('canary') || text.includes('canario') || text.includes('confianca')) {
    return 'canary-trust';
  }

  return 'general';
}

function updateMetric(metric: TrustMetric, tick: number): TrustMetric {
  const wave = tick % 5;

  if (metric.id === 'customer-confidence') {
    return {
      ...metric,
      value: `${93 + (wave % 2)}%`,
      trend: `+${2 + (wave % 2)}%`,
    };
  }

  if (metric.id === 'transparency-coverage') {
    return {
      ...metric,
      value: `${86 + wave}%`,
      trend: '+12%',
    };
  }

  if (metric.id === 'ticket-deflection') {
    return {
      ...metric,
      value: `${36 + wave}%`,
      trend: '+9%',
    };
  }

  return {
    ...metric,
    value: `${16 + wave} min`,
  };
}

function trustRequestsForIntent(intent: TrustIntent): SecureMcpRequest[] {
  const common: SecureMcpRequest[] = [
    {
      tool: 'getPublicSystemStatus',
      purpose: 'Map technical health into customer-facing trust state.',
    },
  ];

  if (intent === 'customer-impact') {
    return [
      ...common,
      {
        tool: 'queryPrometheusMetrics',
        purpose: 'Assess API latency and event loop impact on customer wait time.',
      },
      {
        tool: 'getTraceSummary',
        purpose: 'Find customer-visible tail latency along the checkout journey.',
      },
      {
        tool: 'getKafkaLag',
        purpose: 'Check whether async status updates can be delayed.',
      },
    ];
  }

  if (intent === 'proactive-communication') {
    return [
      ...common,
      {
        tool: 'getDLQStats',
        purpose: 'Identify whether DLQ warrants customer transparency.',
      },
      {
        tool: 'getTraceSummary',
        purpose: 'Create a sanitized customer-safe incident explanation.',
      },
      {
        tool: 'getRetryMetrics',
        purpose: 'Avoid over-communicating internal retries when customer impact is low.',
      },
    ];
  }

  if (intent === 'ticket-pressure') {
    return [
      ...common,
      {
        tool: 'getRetryMetrics',
        purpose: 'Estimate support tickets caused by retry and idempotency confusion.',
      },
      {
        tool: 'getDLQStats',
        purpose: 'Estimate manual review pressure from isolated events.',
      },
    ];
  }

  if (intent === 'canary-trust') {
    return [
      ...common,
      {
        tool: 'getCanaryHealth',
        purpose: 'Decide whether release risk can affect customer trust.',
      },
      {
        tool: 'queryPrometheusMetrics',
        purpose: 'Validate canary latency and retry signals before rollout.',
      },
    ];
  }

  return [
    ...common,
    {
      tool: 'queryPrometheusMetrics',
      purpose: 'Summarize customer reliability from approved metric families.',
    },
    {
      tool: 'getWorkerHealth',
      purpose: 'Check if operations risk can become customer-visible.',
    },
  ];
}

function composeTrustAnswer(question: string): TrustAssistantMessage {
  const intent = classifyIntent(question);
  const batch = secureMcpClientService.executeBatch(
    question,
    trustRequestsForIntent(intent),
  );

  if (!batch.allowed) {
    return {
      id: nextTrustMessageId('assistant'),
      role: 'assistant',
      title: 'Access denied',
      blocked: true,
      content: batch.reason,
      evidence: [
        'No tool was executed.',
        'The request matched the operational security policy denylist.',
      ],
      toolCalls: batch.toolCalls,
    };
  }

  if (intent === 'customer-impact') {
    return {
      id: nextTrustMessageId('assistant'),
      role: 'assistant',
      title: 'Impacto percebido: baixo a moderado',
      content:
        'O cliente pode perceber uma confirmacao de pagamento um pouco mais lenta, mas a jornada ainda esta previsivel. Kafka esta limpando backlog e a DLQ e pequena; o ponto de confianca e explicar a verificacao sem expor detalhes internos.',
      evidence: [
        'API p95 elevado, mas abaixo do limite de rollback.',
        'Payment span domina a cauda de latencia.',
        'Kafka lag em queda reduz risco de status atrasado.',
      ],
      toolCalls: batch.toolCalls,
    };
  }

  if (intent === 'proactive-communication') {
    return {
      id: nextTrustMessageId('assistant'),
      role: 'assistant',
      title: 'Comunicacao recomendada',
      content:
        'Enviar aviso in-app leve para pedidos em verificacao: "Seu pagamento pode levar alguns minutos a mais para confirmar. Estamos acompanhando automaticamente." Isso reduz ansiedade sem prometer prazo falso.',
      evidence: [
        'DLQ tem 2 eventos, sem sinal de incidente amplo.',
        'Retry subiu pouco e idempotencia segue protegendo duplicidade.',
        'Mensagem deve ser contextual, nao status page global para todos.',
      ],
      toolCalls: batch.toolCalls,
    };
  }

  if (intent === 'ticket-pressure') {
    return {
      id: nextTrustMessageId('assistant'),
      role: 'assistant',
      title: 'Pressao de tickets contida',
      content:
        'A pressao de suporte deve cair se a comunicacao proativa for ativada. O console estima deflexao de 38% porque clientes recebem previsibilidade antes de abrir ticket sobre pagamento ou pedido duplicado.',
      evidence: [
        'Retry rate 1.9% com idempotency hit rate de 18%.',
        'Apenas 2 itens em DLQ exigem triagem.',
        'Feed proativo ja cobre pagamento, retry e canary.',
      ],
      toolCalls: batch.toolCalls,
    };
  }

  if (intent === 'canary-trust') {
    return {
      id: nextTrustMessageId('assistant'),
      role: 'assistant',
      title: 'Canary deve proteger confianca',
      content:
        'Manter o canary em 5% e a decisao certa para confianca. A release nao falhou, mas latencia e retries pioraram juntos; promover agora aumentaria incerteza para clientes e suporte.',
      evidence: [
        'Canary score 86 e decisao hold.',
        'Latency delta +17% e retry delta +0.4%.',
        'Trust gate segura rollout antes de virar incidente de experiencia.',
      ],
      toolCalls: batch.toolCalls,
    };
  }

  return {
    id: nextTrustMessageId('assistant'),
    role: 'assistant',
    title: 'Resumo Trust Operations',
    content:
      'A camada Trust traduz sinais tecnicos em experiencia: atrasos pequenos viram mensagens claras, retries viram confianca em idempotencia, e canary vira protecao preventiva de rollout.',
    evidence: [
      'Observability reduces tickets.',
      'Transparency reduces anxiety.',
      'AI Ops improves operational response without exposing sensitive data.',
    ],
    toolCalls: batch.toolCalls,
  };
}

export const trustOperationsService = {
  async getSnapshot(tick = 0): Promise<TrustOperationsSnapshot> {
    await sleep(260);

    const evidence = secureMcpClientService.executeBatch(
      'Build Trust Operations snapshot from approved observability signals.',
      [
        {
          tool: 'getPublicSystemStatus',
          purpose: 'Establish public customer reliability state.',
        },
        {
          tool: 'queryPrometheusMetrics',
          purpose: 'Translate latency and event loop into trust signals.',
        },
        {
          tool: 'getRetryMetrics',
          purpose: 'Estimate duplicate-order anxiety and ticket pressure.',
        },
        {
          tool: 'getCanaryHealth',
          purpose: 'Evaluate release trust gate.',
        },
      ],
    );

    return {
      ...trustOperationsMock,
      generatedAt: `${getClock()} BRT`,
      trustScore: 91 - (tick % 3),
      metrics: trustOperationsMock.metrics.map((metric) => updateMetric(metric, tick)),
      mcpEvidence: evidence.toolCalls,
    };
  },

  getInitialConversation(): TrustAssistantMessage[] {
    return [
      {
        id: 'trust-assistant-ready',
        role: 'assistant',
        title: 'Trust Operations online',
        content:
          'Pergunte sobre impacto percebido, comunicacao proativa, pressao de tickets ou risco do canary. Eu uso apenas MCP seguro e respostas sanitizadas.',
        evidence: [
          'No PII, no payloads, no raw SQL, no stack traces.',
          'A saida e orientada a confianca, transparencia e previsibilidade.',
        ],
      },
    ];
  },

  createUserMessage(content: string): TrustAssistantMessage {
    return {
      id: nextTrustMessageId('user'),
      role: 'user',
      content,
    };
  },

  async ask(question: string): Promise<TrustAssistantMessage> {
    await sleep(340);
    return composeTrustAnswer(question);
  },

  getPrimaryToolSources(): McpToolName[] {
    return [
      'queryPrometheusMetrics',
      'getKafkaLag',
      'getDLQStats',
      'getTraceSummary',
      'getCanaryHealth',
      'getWorkerHealth',
      'getRetryMetrics',
      'getPublicSystemStatus',
    ];
  },
};
