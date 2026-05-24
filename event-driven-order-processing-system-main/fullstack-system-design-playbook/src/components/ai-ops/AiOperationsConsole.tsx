import type { FormEvent } from 'react';
import { useAiOperationsConsole } from '../../hooks/useAiOperationsConsole';
import type {
  AiAssistantMessage,
  AiMetricCard,
  AiOpsConsoleSnapshot,
  AiOpsHealth,
  AiOpsTone,
  CanaryAnalysis,
  IncidentTimelineItem,
  KafkaFlowStage,
  McpPolicyControl,
  OperationalRecommendation,
  RetryIdempotencyInsight,
  SystemHealthNode,
  TraceTimelineEvent,
  WorkerHealthSnapshot,
} from '../../types/aiOps';

const healthLabels: Record<AiOpsHealth, string> = {
  healthy: 'healthy',
  degraded: 'degraded',
  warning: 'warning',
  critical: 'critical',
  blocked: 'blocked',
};

const toneLabels: Record<AiOpsTone, string> = {
  good: 'good',
  neutral: 'neutral',
  warn: 'watch',
  bad: 'bad',
};

export function AiOperationsConsole() {
  const {
    snapshot,
    messages,
    query,
    isThinking,
    setQuery,
    ask,
    askSuggestion,
  } = useAiOperationsConsole();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(query);
  }

  return (
    <section className="aiops-console" aria-labelledby="aiops-title">
      <CommandHeader snapshot={snapshot} />

      <div className="aiops-layout">
        <div className="aiops-layout__main">
          <MetricIntelligencePanel metrics={snapshot.metrics} />
          <SystemHealthPanel nodes={snapshot.healthNodes} />
          <KafkaFlowPanel stages={snapshot.kafkaFlow} workers={snapshot.workerHealth} />
          <TraceInvestigationPanel events={snapshot.traceTimeline} />
        </div>

        <aside className="aiops-layout__side" aria-label="Assistente de IA">
          <AssistantPanel
            messages={messages}
            query={query}
            isThinking={isThinking}
            suggestions={snapshot.suggestedQueries}
            onQueryChange={setQuery}
            onSubmit={handleSubmit}
            onSuggestion={askSuggestion}
          />
          <McpSafetyPanel
            controls={snapshot.controlPlane.controls}
            allowedTools={snapshot.controlPlane.allowedTools}
            deniedCapabilities={snapshot.controlPlane.deniedCapabilities}
          />
        </aside>
      </div>

      <div className="aiops-deep-grid">
        <IncidentTimeline incidents={snapshot.incidents} />
        <CanaryPanel canary={snapshot.canary} />
        <RetryPanel insights={snapshot.retryInsights} />
        <RecommendationPanel recommendations={snapshot.recommendations} />
      </div>
    </section>
  );
}

function CommandHeader({ snapshot }: { snapshot: AiOpsConsoleSnapshot }) {
  return (
    <header className="aiops-command">
      <div className="aiops-command__copy">
        <span className="eyebrow">AI operations command center</span>
        <h2 id="aiops-title">Console de Confiabilidade com IA do MiniShop</h2>
        <p>{snapshot.summary}</p>
      </div>

      <div className="aiops-command__score" aria-label="Pontuacao de confiabilidade">
        <div className="score-ring">
          <span>{snapshot.reliabilityScore}</span>
          <small>/100</small>
        </div>
        <dl>
          <div>
            <dt>Status</dt>
            <dd className={`status-text status-text--${snapshot.globalStatus}`}>
              {healthLabels[snapshot.globalStatus]}
            </dd>
          </div>
          <div>
            <dt>MCP</dt>
            <dd>{snapshot.controlPlane.mode}</dd>
          </div>
          <div>
            <dt>Snapshot</dt>
            <dd>{snapshot.generatedAt}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

function MetricIntelligencePanel({ metrics }: { metrics: AiMetricCard[] }) {
  return (
    <section className="ai-panel" aria-labelledby="metrics-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Realtime metric intelligence</span>
          <h3 id="metrics-title">Painel de Inteligencia de Metricas</h3>
        </div>
        <span className="live-pill">live</span>
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <article className={`metric-card metric-card--${metric.tone}`} key={metric.id}>
            <div className="metric-card__topline">
              <span>{metric.label}</span>
              <em>{toneLabels[metric.tone]}</em>
            </div>
            <strong>
              {metric.value}
              {metric.unit ? <small>{metric.unit}</small> : null}
            </strong>
            <Sparkline values={metric.series} tone={metric.tone} />
            <p>{metric.narrative}</p>
            <div className="metric-card__footer">
              <code>{metric.source}</code>
              <span>{metric.trend}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: AiOpsTone }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = Math.max(max - min, 1);

  return (
    <div className={`sparkline sparkline--${tone}`} aria-hidden="true">
      {values.map((value, index) => {
        const height = 28 + ((value - min) / spread) * 54;

        return (
          <span
            key={`${value}-${index}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function SystemHealthPanel({ nodes }: { nodes: SystemHealthNode[] }) {
  return (
    <section className="ai-panel" aria-labelledby="health-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Distributed system health</span>
          <h3 id="health-title">Visao Geral da Saude do Sistema</h3>
        </div>
        <span className="ai-panel__meta">6 domains</span>
      </div>

      <div className="health-map">
        {nodes.map((node) => (
          <article className={`health-node health-node--${node.status}`} key={node.id}>
            <div>
              <span>{node.tier}</span>
              <strong>{node.label}</strong>
            </div>
            <dl>
              <div>
                <dt>p95</dt>
                <dd>{node.latencyP95}</dd>
              </div>
              <div>
                <dt>Saturation</dt>
                <dd>{node.saturation}</dd>
              </div>
              <div>
                <dt>Throughput</dt>
                <dd>{node.throughput}</dd>
              </div>
            </dl>
            <footer>
              <span>{node.owner}</span>
              <b>{healthLabels[node.status]}</b>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function KafkaFlowPanel({
  stages,
  workers,
}: {
  stages: KafkaFlowStage[];
  workers: WorkerHealthSnapshot[];
}) {
  return (
    <section className="ai-panel" aria-labelledby="flow-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Kafka / DLQ / Worker stream</span>
          <h3 id="flow-title">Fluxo de Status Event-Driven</h3>
        </div>
        <span className="ai-panel__meta">consumer lag guarded</span>
      </div>

      <div className="event-flow">
        {stages.map((stage, index) => (
          <article className={`event-stage event-stage--${stage.status}`} key={stage.id}>
            <span className="event-stage__index">{index + 1}</span>
            <div>
              <strong>{stage.label}</strong>
              <p>{stage.detail}</p>
            </div>
            <b>{stage.metric}</b>
          </article>
        ))}
      </div>

      <div className="worker-grid">
        {workers.map((worker) => (
          <article className={`worker-card worker-card--${worker.status}`} key={worker.name}>
            <div>
              <span>{worker.name}</span>
              <b>{healthLabels[worker.status]}</b>
            </div>
            <dl>
              <div>
                <dt>CPU</dt>
                <dd>{worker.cpu}</dd>
              </div>
              <div>
                <dt>Loop</dt>
                <dd>{worker.eventLoopLag}</dd>
              </div>
              <div>
                <dt>Queue</dt>
                <dd>{worker.queueDepth}</dd>
              </div>
              <div>
                <dt>Conc.</dt>
                <dd>{worker.concurrency}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function AssistantPanel({
  messages,
  query,
  isThinking,
  suggestions,
  onQueryChange,
  onSubmit,
  onSuggestion,
}: {
  messages: AiAssistantMessage[];
  query: string;
  isThinking: boolean;
  suggestions: string[];
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggestion: (question: string) => Promise<void>;
}) {
  return (
    <section className="assistant-panel" aria-labelledby="assistant-title">
      <div className="assistant-panel__header">
        <div>
          <span className="eyebrow">AI query assistant</span>
          <h3 id="assistant-title">Assistente de Consultas</h3>
        </div>
        <span className="assistant-panel__state">
          {isThinking ? 'reasoning' : 'ready'}
        </span>
      </div>

      <div className="message-list">
        {messages.map((message) => (
          <AssistantMessageCard key={message.id} message={message} />
        ))}
        {isThinking ? (
          <div className="message-card message-card--assistant">
            <span className="thinking-dot" />
            <p>Traduzindo pergunta para ferramentas MCP seguras...</p>
          </div>
        ) : null}
      </div>

      <form className="assistant-form" onSubmit={onSubmit}>
        <label htmlFor="aiops-query">Pergunta operacional</label>
        <textarea
          id="aiops-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          rows={3}
        />
        <button type="submit" disabled={isThinking}>
          Executar analise
        </button>
      </form>

      <div className="suggestion-row" aria-label="Consultas sugeridas">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void onSuggestion(suggestion)}
            disabled={isThinking}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}

function AssistantMessageCard({ message }: { message: AiAssistantMessage }) {
  return (
    <article
      className={`message-card message-card--${message.role}${
        message.blocked ? ' message-card--blocked' : ''
      }`}
    >
      {message.title ? <strong>{message.title}</strong> : null}
      <p>{message.content}</p>

      {message.reasoningSteps?.length ? (
        <ol>
          {message.reasoningSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {message.toolCalls?.length ? (
        <div className="tool-call-list">
          {message.toolCalls.map((toolCall) => (
            <span
              className={`tool-call tool-call--${toolCall.status}`}
              key={toolCall.id}
              title={toolCall.summary}
            >
              {toolCall.tool}
              <small>{toolCall.durationMs}ms</small>
            </span>
          ))}
        </div>
      ) : null}

      {message.recommendations?.length ? (
        <div className="recommendation-strip">
          {message.recommendations.map((recommendation) => (
            <span key={recommendation}>{recommendation}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function McpSafetyPanel({
  controls,
  allowedTools,
  deniedCapabilities,
}: {
  controls: McpPolicyControl[];
  allowedTools: string[];
  deniedCapabilities: string[];
}) {
  return (
    <section className="mcp-panel" aria-labelledby="mcp-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Secure orchestration</span>
          <h3 id="mcp-title">MCP Policy Gateway</h3>
        </div>
        <span className="ai-panel__meta">deny-by-default</span>
      </div>

      <div className="policy-list">
        {controls.map((control) => (
          <article className={`policy-card policy-card--${control.state}`} key={control.label}>
            <strong>{control.label}</strong>
            <p>{control.detail}</p>
          </article>
        ))}
      </div>

      <div className="tool-registry">
        <h4>Allowed MCP tools</h4>
        <div>
          {allowedTools.map((tool) => (
            <code key={tool}>{tool}</code>
          ))}
        </div>
      </div>

      <div className="denied-registry">
        <h4>Blocked capabilities</h4>
        <div>
          {deniedCapabilities.map((capability) => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TraceInvestigationPanel({ events }: { events: TraceTimelineEvent[] }) {
  return (
    <section className="ai-panel" aria-labelledby="trace-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Trace investigation</span>
          <h3 id="trace-title">Linha do Tempo de Correlacao</h3>
        </div>
        <span className="ai-panel__meta">trace-8f42</span>
      </div>

      <div className="trace-list">
        {events.map((event) => (
          <article className={`trace-row trace-row--${event.status}`} key={`${event.time}-${event.operation}`}>
            <time>{event.time}</time>
            <div>
              <span>{event.service}</span>
              <strong>{event.operation}</strong>
              <p>{event.detail}</p>
            </div>
            <b>{event.duration}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function IncidentTimeline({ incidents }: { incidents: IncidentTimelineItem[] }) {
  return (
    <section className="ai-panel" aria-labelledby="incident-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">AI incident timeline</span>
          <h3 id="incident-title">Linha do Tempo de Incidentes</h3>
        </div>
      </div>

      <div className="incident-list">
        {incidents.map((incident) => (
          <article className={`incident-card incident-card--${incident.status}`} key={incident.id}>
            <header>
              <span>{incident.id}</span>
              <b>{incident.severity}</b>
              <time>{incident.time}</time>
            </header>
            <h4>{incident.title}</h4>
            <p>{incident.summary}</p>
            <dl>
              <div>
                <dt>Hypothesis</dt>
                <dd>{incident.hypothesis}</dd>
              </div>
              <div>
                <dt>Recommendation</dt>
                <dd>{incident.recommendation}</dd>
              </div>
            </dl>
            <div className="signal-tags">
              {incident.correlatedSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CanaryPanel({ canary }: { canary: CanaryAnalysis }) {
  return (
    <section className="ai-panel" aria-labelledby="canary-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Canary release intelligence</span>
          <h3 id="canary-title">Analise de Liberacao Canary</h3>
        </div>
        <span className="risk-score">{canary.reliabilityScore}</span>
      </div>

      <div className="canary-summary">
        <strong>{canary.release}</strong>
        <span>{canary.trafficShare} traffic</span>
        <p>{canary.decision}</p>
      </div>

      <div className="risk-grid">
        {canary.riskFactors.map((factor) => (
          <article className={`risk-card risk-card--${factor.tone}`} key={factor.label}>
            <span>{factor.label}</span>
            <strong>{factor.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function RetryPanel({ insights }: { insights: RetryIdempotencyInsight[] }) {
  return (
    <section className="ai-panel" aria-labelledby="retry-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Replay and idempotency</span>
          <h3 id="retry-title">Insights de Repeticao</h3>
        </div>
      </div>

      <div className="retry-list">
        {insights.map((insight) => (
          <article className={`retry-card retry-card--${insight.tone}`} key={insight.label}>
            <span>{insight.label}</span>
            <strong>{insight.value}</strong>
            <p>{insight.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendationPanel({
  recommendations,
}: {
  recommendations: OperationalRecommendation[];
}) {
  return (
    <section className="ai-panel" aria-labelledby="recommendation-title">
      <div className="ai-panel__header">
        <div>
          <span className="eyebrow">Operational recommendations</span>
          <h3 id="recommendation-title">Recomendacoes Operacionais</h3>
        </div>
      </div>

      <div className="ops-rec-list">
        {recommendations.map((recommendation) => (
          <article
            className={`ops-rec ops-rec--${recommendation.priority}`}
            key={recommendation.id}
          >
            <span>{recommendation.priority}</span>
            <strong>{recommendation.title}</strong>
            <p>{recommendation.impact}</p>
            <code>{recommendation.action}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
