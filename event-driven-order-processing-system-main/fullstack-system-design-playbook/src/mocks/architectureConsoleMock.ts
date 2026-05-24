import type { ArchitectureConsoleSnapshot } from '../types/architecture';

export const architectureConsoleMock: ArchitectureConsoleSnapshot = {
  generatedAt: '2026-05-21T10:45:00-03:00',
  environment: 'MiniShop lab',
  releaseTrack: 'canary 5%',
  canary: {
    release: 'api-checkout-v2',
    trafficShare: '5%',
    errorBudget: '99.82%',
    latencyP95: '184 ms',
    decision: 'manter observacao',
  },
  kafka: {
    topic: 'minishop.checkout.events',
    lag: '18 mensagens',
    partitions: 6,
    consumerGroup: 'checkout-workers',
  },
  observabilitySignals: [
    {
      label: 'Trace distribuido',
      value: 'trace-8f42',
      detail: 'API, outbox, Kafka, worker e pagamento correlacionados.',
      health: 'healthy',
    },
    {
      label: 'DLQ',
      value: '2 eventos',
      detail: 'Fila de devolucao sob limite operacional definido.',
      health: 'warning',
    },
    {
      label: 'SLO checkout',
      value: '99.4%',
      detail: 'Janela simulada de 30 minutos.',
      health: 'healthy',
    },
    {
      label: 'Retries',
      value: '7 tentativas',
      detail: 'Maioria causada por tempo limite no gateway de pagamento.',
      health: 'warning',
    },
  ],
  cards: [
    {
      id: 'api-request',
      title: 'Requisição de API',
      category: 'Borda HTTP',
      summary:
        'Entrada do checkout com correlation ID, idempotency key e resposta rapida para a UI.',
      statusLabel: '202 aceito',
      health: 'healthy',
      owner: 'MiniShop API',
      signal: 'http.server.duration p95 122 ms',
      metrics: [
        { label: 'RPS', value: '42', trend: '+8%', tone: 'positive' },
        { label: 'Timeout', value: '0.3%', trend: '-0.1%', tone: 'positive' },
      ],
    },
    {
      id: 'postgres-commit',
      title: 'Commit do PostgreSQL',
      category: 'Persistencia',
      summary:
        'Pedido, tentativa de pagamento e registro de outbox gravados na mesma transacao.',
      statusLabel: 'commit ok',
      health: 'healthy',
      owner: 'Order Service',
      signal: 'db.transaction.duration p95 48 ms',
      metrics: [
        { label: 'Tx/min', value: '1.260', trend: '+3%', tone: 'neutral' },
        { label: 'Locks', value: '0', trend: 'estavel', tone: 'positive' },
      ],
    },
    {
      id: 'outbox-event',
      title: 'Evento da Caixa de Saída',
      category: 'Outbox',
      summary:
        'Evento duravel aguardando publicacao apos o commit do banco de dados.',
      statusLabel: 'publicando',
      health: 'healthy',
      owner: 'Outbox Worker',
      signal: 'outbox.pending_records 12',
      metrics: [
        { label: 'Pendentes', value: '12', trend: '-5', tone: 'positive' },
        { label: 'Idade max', value: '3 s', trend: 'ok', tone: 'positive' },
      ],
    },
    {
      id: 'kafka-topic',
      title: 'Tópico do Kafka',
      category: 'Streaming',
      summary:
        'Eventos de checkout distribuidos para consumidores assincronos com grupos independentes.',
      statusLabel: 'lag baixo',
      health: 'healthy',
      owner: 'Platform Events',
      signal: 'kafka.consumer.lag 18',
      metrics: [
        { label: 'Particoes', value: '6', tone: 'neutral' },
        { label: 'Lag', value: '18', trend: '-11', tone: 'positive' },
      ],
    },
    {
      id: 'worker-processing',
      title: 'Processamento de Workers',
      category: 'Async',
      summary:
        'Workers aplicam regras de dominio fora do caminho sincrono da requisicao.',
      statusLabel: 'ativo',
      health: 'healthy',
      owner: 'Checkout Workers',
      signal: 'worker.jobs.completed 318',
      metrics: [
        { label: 'Jobs/min', value: '318', trend: '+14', tone: 'positive' },
        { label: 'Retry', value: '1.7%', trend: '+0.2%', tone: 'neutral' },
      ],
    },
    {
      id: 'redis-idempotency',
      title: 'Idempotência do Redis',
      category: 'Protecao',
      summary:
        'Chaves curtas evitam duplicidade em requests e consumidores durante retries.',
      statusLabel: 'dedupe ok',
      health: 'healthy',
      owner: 'Reliability Layer',
      signal: 'redis.idempotency.hit_rate 18%',
      metrics: [
        { label: 'TTL', value: '24 h', tone: 'neutral' },
        { label: 'Hits', value: '18%', trend: '+2%', tone: 'positive' },
      ],
    },
    {
      id: 'payment-check',
      title: 'Verificação de Pagamento',
      category: 'Gateway',
      summary:
        'Resultados desconhecidos entram em verificacao antes de confirmar ou cancelar pedido.',
      statusLabel: 'verificando',
      health: 'warning',
      owner: 'Payment Service',
      signal: 'payment.unknown_results 5',
      metrics: [
        { label: 'Pendentes', value: '5', trend: '+2', tone: 'negative' },
        { label: 'P95 gateway', value: '740 ms', tone: 'neutral' },
      ],
    },
    {
      id: 'dlq-alert',
      title: 'Alerta de Fila de Devolução (DLQ)',
      category: 'Resiliencia',
      summary:
        'Mensagens com repeticoes esgotadas ficam isoladas para analise e reprocessamento controlado.',
      statusLabel: '2 itens',
      health: 'warning',
      owner: 'Ops',
      signal: 'dlq.messages 2',
      metrics: [
        { label: 'SLA triagem', value: '15 min', tone: 'neutral' },
        { label: 'Abertos', value: '2', trend: '+1', tone: 'negative' },
      ],
    },
    {
      id: 'batch-reconciliation',
      title: 'Conciliação em Lote',
      category: 'Backoffice',
      summary:
        'Rotina periodica compara pedidos pendentes com o gateway e retoma fluxos incompletos.',
      statusLabel: 'agendado',
      health: 'idle',
      owner: 'Finance Ops',
      signal: 'batch.next_run 02:00',
      metrics: [
        { label: 'Janela', value: '02:00', tone: 'neutral' },
        { label: 'Pendentes', value: '9', tone: 'neutral' },
      ],
    },
    {
      id: 'canary-health',
      title: 'Saúde da Versão Canary',
      category: 'Release',
      summary:
        'Pequena fatia de trafego mede erro, latencia e saturacao antes da promocao.',
      statusLabel: 'observacao',
      health: 'healthy',
      owner: 'Release Engineering',
      signal: 'canary.error_rate 0.18%',
      metrics: [
        { label: 'Trafego', value: '5%', tone: 'neutral' },
        { label: 'Erro', value: '0.18%', trend: '-0.04%', tone: 'positive' },
      ],
    },
    {
      id: 'observability-signals',
      title: 'Sinais de Observabilidade',
      category: 'Telemetry',
      summary:
        'Metricas, logs e traces mantem a jornada de checkout investigavel de ponta a ponta.',
      statusLabel: 'correlacionado',
      health: 'healthy',
      owner: 'Observability',
      signal: 'otel.spans.linked 16',
      metrics: [
        { label: 'Spans', value: '16', tone: 'neutral' },
        { label: 'Logs', value: '42', tone: 'neutral' },
      ],
    },
    {
      id: 'saga-orchestrator',
      title: 'Orquestrador de Sagas',
      category: 'Workflow',
      summary:
        'Coordena passos distribuidos, aplica compensacoes e deixa tentativas visiveis para operadores.',
      statusLabel: 'simulado',
      health: 'healthy',
      owner: 'Architecture Console',
      signal: 'saga.workflow.status RUNNING',
      metrics: [
        { label: 'Passos', value: '8', tone: 'neutral' },
        { label: 'Compensacoes', value: '5', tone: 'neutral' },
      ],
    },
    {
      id: 'netflix-conductor-workflow',
      title: 'Fluxo de Trabalho do Netflix Conductor',
      category: 'Conductor',
      summary:
        'Modelo conceitual de workflow engine; nenhum servidor Conductor real e chamado.',
      statusLabel: 'mockado',
      health: 'idle',
      owner: 'Docs + Frontend',
      signal: 'conductor.workflow.mock true',
      metrics: [
        { label: 'Infra real', value: '0', tone: 'positive' },
        { label: 'Dados', value: 'mocks', tone: 'neutral' },
      ],
    },
  ],
};
