import { aiOpsConsoleMock } from '../mocks/aiOpsMock';
import type {
  AiAssistantMessage,
  AiMetricCard,
  AiOpsConsoleSnapshot,
  McpToolCall,
} from '../types/aiOps';
import { mcpToolGatewayService } from './mcpToolGatewayService';

type AiIntent =
  | 'api-latency'
  | 'worker-saturation'
  | 'canary-risk'
  | 'dlq-anomaly'
  | 'retry-idempotency'
  | 'trace-investigation'
  | 'system-status';

let messageCounter = 0;

function nextMessageId(prefix: string) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getClock() {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

function getMetricPatch(metric: AiMetricCard, tick: number): Partial<AiMetricCard> {
  const wave = tick % 6;

  if (metric.id === 'api-latency') {
    return {
      value: String(184 + wave * 3),
      trend: `+${24 + wave} ms`,
      series: [...metric.series.slice(1), 184 + wave * 3],
    };
  }

  if (metric.id === 'event-loop') {
    return {
      value: String(42 + wave),
      trend: `+${5 + wave} ms`,
      series: [...metric.series.slice(1), 42 + wave],
    };
  }

  if (metric.id === 'kafka-lag') {
    return {
      value: String(Math.max(24, 46 - wave * 2)),
      trend: '-11',
      series: [...metric.series.slice(1), Math.max(24, 46 - wave * 2)],
    };
  }

  if (metric.id === 'worker-cpu') {
    return {
      value: String(59 + wave),
      trend: '+4%',
      series: [...metric.series.slice(1), 59 + wave],
    };
  }

  if (metric.id === 'retry-rate') {
    const nextValue = (1.6 + wave * 0.08).toFixed(1);
    return {
      value: nextValue,
      trend: '+0.4%',
      series: [...metric.series.slice(1), Number(nextValue)],
    };
  }

  return metric;
}

function classifyIntent(question: string): AiIntent {
  const text = normalize(question);

  if (text.includes('worker') || text.includes('sobrecarreg')) {
    return 'worker-saturation';
  }

  if (text.includes('canary') || text.includes('promovid') || text.includes('release')) {
    return 'canary-risk';
  }

  if (text.includes('dlq') || text.includes('fila de devolucao')) {
    return 'dlq-anomaly';
  }

  if (text.includes('retry') || text.includes('idempot') || text.includes('duplic')) {
    return 'retry-idempotency';
  }

  if (text.includes('trace') || text.includes('rastream') || text.includes('jaeger')) {
    return 'trace-investigation';
  }

  if (text.includes('lenta') || text.includes('latencia') || text.includes('api')) {
    return 'api-latency';
  }

  return 'system-status';
}

function createUserMessage(question: string): AiAssistantMessage {
  return {
    id: nextMessageId('user'),
    role: 'user',
    content: question,
  };
}

function createBlockedMessage(question: string, reason: string): AiAssistantMessage {
  return {
    id: nextMessageId('assistant'),
    role: 'assistant',
    title: 'Solicitacao bloqueada pelo MCP',
    blocked: true,
    content:
      'Nao executei nenhuma ferramenta. O gateway MCP recusou a solicitacao antes de tocar em observabilidade porque ela parece pedir acesso sensivel, bypass de politica ou uma capacidade proibida.',
    reasoningSteps: [
      `Pergunta recebida: "${question}"`,
      reason,
      'Politica aplicada: deny-by-default, allowlist de ferramentas e filtro de dados sensiveis.',
    ],
    toolCalls: [
      mcpToolGatewayService.deniedToolCall(
        'Bloquear prompt sensivel antes da orquestracao.',
      ),
    ],
    recommendations: [
      'Reformule como uma pergunta operacional de alto nivel, por exemplo: "A API esta lenta?"',
      'Nao inclua segredos, comandos, SQL, variaveis de ambiente ou pedidos de payload bruto.',
    ],
  };
}

function composeIntentAnswer(intent: AiIntent, toolCalls: McpToolCall[]): AiAssistantMessage {
  if (intent === 'api-latency') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'A API esta levemente degradada',
      content:
        'Sim. A API esta mais lenta que a linha base, mas a degradacao ainda parece controlada. O p95 esta perto de 188 ms, o event loop subiu de forma moderada e os traces apontam maior peso no span de pagamento, nao no commit do banco.',
      reasoningSteps: [
        'Traduzir pergunta em metricas aprovadas de latencia, event loop e status publico.',
        'Comparar p95 da API com baseline e risco do canary.',
        'Correlacionar trace de pagamento, outbox e worker para separar causa interna de dependencia externa.',
      ],
      toolCalls,
      recommendations: [
        'Manter canary em 5% ate o p95 voltar abaixo de 160 ms.',
        'Abrir trace-8f42 no Jaeger e comparar spans payment.authorize por versao.',
        'Nao promover release enquanto retry e latencia sobem juntos.',
      ],
    };
  }

  if (intent === 'worker-saturation') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'Workers nao estao sobrecarregados',
      content:
        'Nao ha sinal forte de saturacao. CPU esta em torno de 62%, filas internas seguem pequenas e o lag do Kafka esta caindo. O outbox-publisher merece observacao porque tem event loop lag maior, mas ainda nao exige escala emergencial.',
      reasoningSteps: [
        'Consultar saude dos workers por CPU, lag de event loop, queue depth e concurrency.',
        'Cruzar com lag do Kafka para detectar backlog real.',
        'Verificar retry para confirmar se o aumento de carga virou retrabalho.',
      ],
      toolCalls,
      recommendations: [
        'Monitorar outbox-publisher por mais uma janela de 15 minutos.',
        'Escalar workers apenas se Kafka lag voltar a subir com CPU acima de 75%.',
      ],
    };
  }

  if (intent === 'canary-risk') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'Canary deve ficar retido',
      content:
        'Eu nao promoveria agora. O canary tem score 86, erro dentro do budget, mas latencia e retries pioraram juntos. Isso e exatamente o tipo de regressao pequena que um rollout progressivo deve conter.',
      reasoningSteps: [
        'Ler saude do canary por erro, latencia, retry e DLQ.',
        'Comparar telemetria do canary com status publico do sistema.',
        'Aplicar politica de promocao conservadora para SRE.',
      ],
      toolCalls,
      recommendations: [
        'Segurar trafego em 5% ate a latencia estabilizar.',
        'Promover somente se p95 ficar abaixo de 160 ms e DLQ nao crescer por 20 minutos.',
      ],
    };
  }

  if (intent === 'dlq-anomaly') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'DLQ pequena, causa concentrada',
      content:
        'A DLQ cresceu pouco: existem 2 eventos abertos, idade maxima de 11 minutos e causa dominante ligada a timeout do gateway de pagamento depois do budget de retry. Nao parece falha sistemica do Kafka.',
      reasoningSteps: [
        'Consultar estatisticas agregadas da DLQ sem payload bruto.',
        'Correlacionar eventos de trace com spans de pagamento.',
        'Validar se retry e idempotencia permitem replay controlado.',
      ],
      toolCalls,
      recommendations: [
        'Triar os 2 eventos manualmente antes de replay.',
        'Reprocessar apenas com idempotency key validada.',
        'Abrir alerta SEV2 se DLQ passar de 10 eventos em 15 minutos.',
      ],
    };
  }

  if (intent === 'retry-idempotency') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'Retry nao indica duplicidade agora',
      content:
        'O risco de duplicar pedidos esta baixo. A taxa de retry subiu para 1.9%, mas o hit rate de idempotencia esta em 18% e a janela de protecao de 24 horas cobre os ciclos de retry e conciliacao.',
      reasoningSteps: [
        'Consultar retry metrics e protecoes de idempotencia.',
        'Cruzar com Kafka lag para confirmar que replay nao esta acumulando backlog.',
        'Avaliar se os eventos em DLQ podem ser reprocessados com seguranca.',
      ],
      toolCalls,
      recommendations: [
        'Manter replay manual para DLQ ate a causa do gateway estabilizar.',
        'Nao reduzir TTL de idempotencia durante o incidente.',
      ],
    };
  }

  if (intent === 'trace-investigation') {
    return {
      id: nextMessageId('assistant'),
      role: 'assistant',
      title: 'Trace aponta cauda no pagamento',
      content:
        'A linha do tempo sugere que o maior custo esta em payment.authorize, com 740 ms. API, commit no banco e publish do outbox estao dentro de faixas normais para esta simulacao.',
      reasoningSteps: [
        'Buscar resumo de traces pelo MCP, nao spans brutos irrestritos.',
        'Comparar duracao por servico na jornada de checkout.',
        'Relacionar trace com canary e retry para uma hipotese de causa raiz.',
      ],
      toolCalls,
      recommendations: [
        'Filtrar Jaeger por trace-8f42 e operacao payment.authorize.',
        'Comparar canary vs baseline antes de promover release.',
      ],
    };
  }

  return {
    id: nextMessageId('assistant'),
    role: 'assistant',
    title: 'Sistema em degradacao controlada',
    content:
      'O estado publico do MiniShop esta operacional com degradacao moderada. API e pagamento sao os sinais mais quentes; Kafka, Redis, Postgres e workers seguem saudaveis.',
    reasoningSteps: [
      'Consultar status publico consolidado.',
      'Ler metricas aprovadas de latencia e saturacao.',
      'Gerar resumo operacional sem acessar infraestrutura diretamente.',
    ],
    toolCalls,
    recommendations: [
      'Priorizar investigacao da API e do gateway de pagamento.',
      'Manter o canary retido ate estabilizar a cauda de latencia.',
    ],
  };
}

function invokeToolsForIntent(intent: AiIntent): McpToolCall[] {
  if (intent === 'api-latency') {
    return [
      mcpToolGatewayService.queryPrometheusMetrics('Avaliar latencia da API.').call,
      mcpToolGatewayService.getTraceSummary('Correlacionar latencia com traces.').call,
      mcpToolGatewayService.getPublicSystemStatus('Checar saude publica.').call,
    ];
  }

  if (intent === 'worker-saturation') {
    return [
      mcpToolGatewayService.getWorkerHealth('Avaliar saturacao dos workers.').call,
      mcpToolGatewayService.getKafkaLag('Checar backlog no Kafka.').call,
      mcpToolGatewayService.getRetryMetrics('Checar retrabalho por retry.').call,
    ];
  }

  if (intent === 'canary-risk') {
    return [
      mcpToolGatewayService.getCanaryHealth('Avaliar promocao de canary.').call,
      mcpToolGatewayService.queryPrometheusMetrics('Comparar metricas do canary.').call,
      mcpToolGatewayService.getDLQStats('Checar impacto em DLQ.').call,
    ];
  }

  if (intent === 'dlq-anomaly') {
    return [
      mcpToolGatewayService.getDLQStats('Explicar crescimento de DLQ.').call,
      mcpToolGatewayService.getTraceSummary('Correlacionar DLQ com traces.').call,
      mcpToolGatewayService.getRetryMetrics('Avaliar replay e idempotencia.').call,
    ];
  }

  if (intent === 'retry-idempotency') {
    return [
      mcpToolGatewayService.getRetryMetrics('Avaliar retry e idempotencia.').call,
      mcpToolGatewayService.getKafkaLag('Checar backlog causado por replay.').call,
      mcpToolGatewayService.getDLQStats('Validar eventos isolados.').call,
    ];
  }

  if (intent === 'trace-investigation') {
    return [
      mcpToolGatewayService.getTraceSummary('Investigar rastreamento distribuido.').call,
      mcpToolGatewayService.getCanaryHealth('Correlacionar trace com release.').call,
      mcpToolGatewayService.queryPrometheusMetrics('Checar metricas do periodo.').call,
    ];
  }

  return [
    mcpToolGatewayService.getPublicSystemStatus('Responder status operacional.').call,
    mcpToolGatewayService.queryPrometheusMetrics('Obter metricas agregadas.').call,
  ];
}

export const aiOperationsService = {
  getSnapshot(): AiOpsConsoleSnapshot {
    return aiOpsConsoleMock;
  },

  getLiveSnapshot(tick: number): AiOpsConsoleSnapshot {
    return {
      ...aiOpsConsoleMock,
      generatedAt: `${getClock()} BRT`,
      reliabilityScore: 92 - (tick % 3),
      metrics: aiOpsConsoleMock.metrics.map((metric) => ({
        ...metric,
        ...getMetricPatch(metric, tick),
      })),
    };
  },

  getInitialConversation(): AiAssistantMessage[] {
    return [
      {
        id: 'assistant-ready',
        role: 'assistant',
        title: 'AIOps pronto',
        content:
          'Pergunte em linguagem natural. Eu traduzo a intencao para ferramentas MCP seguras, aplico politica e devolvo um resumo operacional.',
        reasoningSteps: [
          'Acesso direto a infraestrutura esta bloqueado.',
          'Ferramentas permitidas sao agregadas e sem payload sensivel.',
          'Exemplo: "A API esta lenta?"',
        ],
      },
    ];
  },

  createUserMessage,

  async ask(question: string): Promise<AiAssistantMessage> {
    await new Promise((resolve) => setTimeout(resolve, 380));

    const inspection = mcpToolGatewayService.inspectPrompt(question);

    if (!inspection.allowed) {
      return createBlockedMessage(question, inspection.reason);
    }

    const intent = classifyIntent(question);
    const toolCalls = invokeToolsForIntent(intent);

    return composeIntentAnswer(intent, toolCalls);
  },
};
