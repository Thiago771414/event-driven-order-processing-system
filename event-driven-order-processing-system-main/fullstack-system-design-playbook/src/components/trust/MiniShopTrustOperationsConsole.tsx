import { Component, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTrustOperationsConsole } from '../../hooks/useTrustOperationsConsole';
import type {
  CustomerReliabilitySignal,
  ExperienceGuardrail,
  JourneyImpactSegment,
  TransparencyFeedItem,
  TrustAssistantMessage,
  TrustMetric,
  TrustOperationsSnapshot,
} from '../../types/trust';

const surface =
  'rounded-lg border border-slate-700/60 bg-slate-950/70 shadow-trust backdrop-blur';
const innerSurface = 'rounded-lg border border-slate-700/50 bg-slate-900/55';

const statusStyles = {
  healthy: 'border-trust-mint/60 text-trust-mint',
  degraded: 'border-trust-amber/60 text-trust-amber',
  warning: 'border-trust-amber/60 text-trust-amber',
  critical: 'border-trust-rose/70 text-trust-rose',
  blocked: 'border-trust-rose/70 text-trust-rose',
};

const toneStyles = {
  good: 'border-trust-mint/50 text-trust-mint',
  neutral: 'border-trust-blue/40 text-trust-blue',
  warn: 'border-trust-amber/60 text-trust-amber',
  bad: 'border-trust-rose/70 text-trust-rose',
};

export class TrustOperationsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className={`${surface} p-5`}>
          <span className="eyebrow">Trust layer degraded</span>
          <h2 className="mb-2 text-xl font-semibold text-white">
            MiniShop Trust Operations Console
          </h2>
          <p className="mb-0 text-sm leading-6 text-slate-300">
            A camada visual falhou com seguranca. O restante do console permanece
            disponivel e nenhuma ferramenta MCP sensivel foi executada.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}

export function MiniShopTrustOperationsConsole() {
  const {
    snapshot,
    messages,
    query,
    isLoading,
    isThinking,
    error,
    setQuery,
    ask,
    askSuggestion,
    refresh,
  } = useTrustOperationsConsole();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(query);
  }

  if (isLoading && !snapshot) {
    return <TrustConsoleSkeleton />;
  }

  if (!snapshot) {
    return (
      <section className={`${surface} p-5`}>
        <span className="eyebrow">Customer reliability layer</span>
        <h2 className="mb-2 text-xl font-semibold text-white">
          MiniShop Trust Operations Console
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          Trust Operations iniciou em modo degradado. A interface principal do
          AIOps permanece disponivel enquanto a camada de experiencia se
          recupera.
        </p>
        <button
          className="mt-4 rounded-lg border border-trust-mint/50 px-3 py-2 text-sm font-bold text-trust-mint hover:bg-trust-mint/10"
          type="button"
          onClick={refresh}
        >
          Recarregar Trust Layer
        </button>
      </section>
    );
  }

  return (
    <motion.section
      className="trust-console"
      aria-labelledby="trust-console-title"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <TrustHeader snapshot={snapshot} error={error} onRefresh={refresh} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="grid gap-4">
          <TrustMetricGrid metrics={snapshot.metrics} />
          <CustomerReliabilitySignals signals={snapshot.reliabilitySignals} />
          <JourneyImpactMap segments={snapshot.journeyImpact} />
        </div>

        <div className="grid gap-4">
          <TrustAssistantPanel
            messages={messages}
            query={query}
            isThinking={isThinking}
            suggestions={snapshot.suggestedQuestions}
            onQueryChange={setQuery}
            onSubmit={handleSubmit}
            onSuggestion={askSuggestion}
          />
          <McpEvidencePanel snapshot={snapshot} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <IncidentTransparencyFeed items={snapshot.transparencyFeed} />
        <ExperienceGuardrails guardrails={snapshot.guardrails} />
      </div>
    </motion.section>
  );
}

function TrustHeader({
  snapshot,
  error,
  onRefresh,
}: {
  snapshot: TrustOperationsSnapshot;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <header className={`${surface} mb-4 overflow-hidden p-5 shadow-glow`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <span className="eyebrow">Trust & Experience Layer</span>
          <h2
            id="trust-console-title"
            className="mb-3 max-w-4xl text-2xl font-semibold leading-tight text-white md:text-4xl"
          >
            MiniShop Trust Operations Console
          </h2>
          <p className="mb-4 max-w-4xl text-sm leading-6 text-slate-300 md:text-base">
            {snapshot.narrative}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-trust-mint/35 bg-trust-mint/10 px-3 py-1 text-xs font-bold text-trust-mint">
              operational intelligence
            </span>
            <span className="rounded-full border border-trust-blue/30 bg-trust-blue/10 px-3 py-1 text-xs font-bold text-trust-blue">
              customer reliability
            </span>
            <span className="rounded-full border border-trust-amber/30 bg-trust-amber/10 px-3 py-1 text-xs font-bold text-trust-amber">
              proactive transparency
            </span>
          </div>
        </div>

        <div className={`${innerSurface} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">
                Trust score
              </span>
              <div className="mt-2 flex items-end gap-2">
                <strong className="text-5xl font-black leading-none text-white">
                  {snapshot.trustScore}
                </strong>
                <span className="pb-1 text-sm font-bold text-slate-400">/100</span>
              </div>
            </div>
            <button
              className="rounded-lg border border-slate-600/70 px-3 py-2 text-xs font-bold text-slate-200 hover:border-trust-mint/60 hover:text-trust-mint"
              type="button"
              onClick={onRefresh}
            >
              Refresh
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{snapshot.headline}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="font-bold uppercase text-slate-500">Snapshot</dt>
              <dd className="mt-1 text-slate-200">{snapshot.generatedAt}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase text-slate-500">MCP evidence</dt>
              <dd className="mt-1 text-slate-200">{snapshot.mcpEvidence.length} tools</dd>
            </div>
          </dl>
          {error ? (
            <p className="mt-3 rounded-lg border border-trust-amber/40 bg-trust-amber/10 p-2 text-xs text-trust-amber">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function TrustMetricGrid({ metrics }: { metrics: TrustMetric[] }) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="trust-metrics-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Experience telemetry</span>
          <h3 id="trust-metrics-title" className="mb-0 text-lg font-semibold text-white">
            Trust Signals
          </h3>
        </div>
        <span className="rounded-full border border-trust-mint/40 px-3 py-1 text-xs font-bold text-trust-mint">
          live synthesis
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.article
            className={`${innerSurface} border-t-2 p-4 ${toneStyles[metric.tone]}`}
            key={metric.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
          >
            <span className="text-xs font-bold uppercase text-slate-400">
              {metric.label}
            </span>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="text-3xl font-black leading-none text-white">
                {metric.value}
              </strong>
              <b className="text-sm">{metric.trend}</b>
            </div>
            <p className="mt-4 mb-0 text-sm leading-6 text-slate-300">
              {metric.explanation}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function CustomerReliabilitySignals({
  signals,
}: {
  signals: CustomerReliabilitySignal[];
}) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="customer-signals-title">
      <div className="mb-4">
        <span className="eyebrow">Customer Reliability Layer</span>
        <h3 id="customer-signals-title" className="mb-0 text-lg font-semibold text-white">
          Telemetria tecnica traduzida em confianca
        </h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {signals.map((signal) => (
          <article
            className={`${innerSurface} border-l-4 p-4 ${statusStyles[signal.status]}`}
            key={signal.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  {signal.source}
                </span>
                <h4 className="mt-1 mb-0 text-base font-semibold text-white">
                  {signal.title}
                </h4>
              </div>
              <span className="rounded-full border border-current px-2 py-1 text-xs font-black">
                {signal.confidence}%
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  Technical signal
                </span>
                <p className="mt-1 mb-0 text-sm leading-6 text-slate-300">
                  {signal.technicalSignal}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  Customer signal
                </span>
                <p className="mt-1 mb-0 text-sm leading-6 text-slate-300">
                  {signal.customerSignal}
                </p>
              </div>
            </div>
            <p className="mt-4 mb-0 rounded-lg bg-slate-950/60 p-3 text-sm leading-6 text-slate-200">
              {signal.operationalMeaning}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function IncidentTransparencyFeed({ items }: { items: TransparencyFeedItem[] }) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="transparency-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Proactive Communication Engine</span>
          <h3 id="transparency-title" className="mb-0 text-lg font-semibold text-white">
            Incident Transparency Feed
          </h3>
        </div>
        <span className="rounded-full border border-trust-blue/40 px-3 py-1 text-xs font-bold text-trust-blue">
          ticket pressure down
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <motion.article
            className={`${innerSurface} p-4`}
            key={item.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
          >
            <header className="flex flex-wrap items-center gap-2">
              <time className="text-xs font-bold text-slate-400">{item.time}</time>
              <span className="rounded-full border border-slate-600/70 px-2 py-1 text-xs font-bold text-slate-300">
                {item.channel}
              </span>
              <span
                className={`rounded-full border px-2 py-1 text-xs font-bold ${
                  item.risk === 'low'
                    ? 'border-trust-mint/50 text-trust-mint'
                    : item.risk === 'high'
                      ? 'border-trust-rose/60 text-trust-rose'
                      : 'border-trust-amber/60 text-trust-amber'
                }`}
              >
                {item.risk} risk
              </span>
              <span className="ml-auto text-xs font-bold uppercase text-slate-500">
                {item.status}
              </span>
            </header>
            <h4 className="mt-3 mb-2 text-base font-semibold text-white">{item.title}</h4>
            <p className="rounded-lg border border-trust-mint/20 bg-trust-mint/10 p-3 text-sm leading-6 text-slate-100">
              {item.customerMessage}
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <p className="mb-0 text-xs leading-5 text-slate-400">
                Internal cause: {item.internalCause}
              </p>
              <p className="mb-0 text-xs font-bold leading-5 text-trust-blue">
                {item.ticketDeflection}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function JourneyImpactMap({ segments }: { segments: JourneyImpactSegment[] }) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="journey-title">
      <div className="mb-4">
        <span className="eyebrow">Event-driven transparency</span>
        <h3 id="journey-title" className="mb-0 text-lg font-semibold text-white">
          Customer Journey Impact Map
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {segments.map((segment, index) => (
          <article
            className={`${innerSurface} relative overflow-hidden border-t-2 p-4 ${
              statusStyles[segment.status]
            }`}
            key={segment.id}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-xs font-black text-white">
              {index + 1}
            </span>
            <h4 className="mt-4 mb-2 text-base font-semibold text-white">
              {segment.stage}
            </h4>
            <p className="mb-3 text-sm leading-6 text-slate-300">{segment.signal}</p>
            <dl className="grid gap-3 text-xs">
              <div>
                <dt className="font-bold uppercase text-slate-500">Expectation</dt>
                <dd className="mt-1 text-slate-300">{segment.customerExpectation}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-slate-500">Trust impact</dt>
                <dd className="mt-1 text-slate-300">{segment.trustImpact}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExperienceGuardrails({ guardrails }: { guardrails: ExperienceGuardrail[] }) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="guardrails-title">
      <div className="mb-4">
        <span className="eyebrow">Trust Engineering guardrails</span>
        <h3 id="guardrails-title" className="mb-0 text-lg font-semibold text-white">
          Experience Policies
        </h3>
      </div>
      <div className="grid gap-3">
        {guardrails.map((guardrail) => (
          <article
            className={`${innerSurface} border-l-4 p-4 ${statusStyles[guardrail.status]}`}
            key={guardrail.id}
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="mb-0 text-base font-semibold text-white">{guardrail.title}</h4>
              <span className="rounded-full border border-current px-2 py-1 text-xs font-bold">
                {guardrail.current}
              </span>
            </div>
            <p className="mt-3 mb-0 text-sm leading-6 text-slate-300">
              {guardrail.policy}
            </p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold uppercase text-slate-500">Threshold</dt>
                <dd className="mt-1 text-slate-300">{guardrail.threshold}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-slate-500">Action</dt>
                <dd className="mt-1 text-slate-300">{guardrail.action}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustAssistantPanel({
  messages,
  query,
  isThinking,
  suggestions,
  onQueryChange,
  onSubmit,
  onSuggestion,
}: {
  messages: TrustAssistantMessage[];
  query: string;
  isThinking: boolean;
  suggestions: string[];
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggestion: (question: string) => Promise<void>;
}) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="trust-assistant-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">AI Operational Assistant</span>
          <h3 id="trust-assistant-title" className="mb-0 text-lg font-semibold text-white">
            Customer Reliability Copilot
          </h3>
        </div>
        <span className="rounded-full border border-trust-mint/40 px-3 py-1 text-xs font-bold text-trust-mint">
          {isThinking ? 'reasoning' : 'ready'}
        </span>
      </div>

      <div className="grid max-h-[520px] gap-3 overflow-auto pr-1">
        {messages.map((message) => (
          <TrustMessage key={message.id} message={message} />
        ))}
        {isThinking ? (
          <div className={`${innerSurface} p-3 text-sm text-slate-300`}>
            Building customer-safe operational answer...
          </div>
        ) : null}
      </div>

      <form className="mt-4 grid gap-2" onSubmit={onSubmit}>
        <label className="text-xs font-bold uppercase text-slate-500" htmlFor="trust-query">
          Trust question
        </label>
        <textarea
          id="trust-query"
          className="min-h-24 resize-y rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-sm leading-6 text-white outline-none focus:border-trust-mint/70 focus:ring-2 focus:ring-trust-mint/10"
          value={query}
          rows={3}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button
          className="rounded-lg border border-trust-mint/50 bg-trust-mint px-3 py-2 text-sm font-black text-slate-950 hover:bg-trust-mint/90"
          type="submit"
          disabled={isThinking}
        >
          Analyze trust impact
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            className="rounded-full border border-slate-700 px-3 py-1.5 text-left text-xs font-bold text-slate-300 hover:border-trust-blue/60 hover:text-trust-blue"
            key={suggestion}
            type="button"
            disabled={isThinking}
            onClick={() => void onSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}

function TrustMessage({ message }: { message: TrustAssistantMessage }) {
  return (
    <article
      className={`${innerSurface} p-3 ${
        message.role === 'user'
          ? 'ml-8 border-trust-blue/40 bg-trust-blue/10'
          : message.blocked
            ? 'border-trust-rose/50 bg-trust-rose/10'
            : ''
      }`}
    >
      {message.title ? (
        <strong className="mb-2 block text-sm font-semibold text-white">
          {message.title}
        </strong>
      ) : null}
      <p className="mb-0 text-sm leading-6 text-slate-300">{message.content}</p>

      {message.evidence?.length ? (
        <ul className="mt-3 grid gap-1.5 pl-4 text-xs leading-5 text-slate-400">
          {message.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {message.toolCalls?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.toolCalls.map((call) => (
            <span
              className={`rounded-full border px-2 py-1 text-xs font-bold ${
                call.status === 'allowed'
                  ? 'border-trust-mint/40 text-trust-mint'
                  : 'border-trust-rose/50 text-trust-rose'
              }`}
              key={call.id}
              title={call.summary}
            >
              {call.tool}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function McpEvidencePanel({ snapshot }: { snapshot: TrustOperationsSnapshot }) {
  return (
    <section className={`${surface} p-4`} aria-labelledby="mcp-evidence-title">
      <div className="mb-4">
        <span className="eyebrow">AI-safe MCP evidence</span>
        <h3 id="mcp-evidence-title" className="mb-0 text-lg font-semibold text-white">
          Operational Gateway
        </h3>
      </div>
      <div className="grid gap-2">
        {snapshot.mcpEvidence.map((call) => (
          <article className={`${innerSurface} p-3`} key={call.id}>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs font-bold text-trust-mint">{call.tool}</code>
              <span className="text-xs font-bold text-slate-500">{call.durationMs}ms</span>
            </div>
            <p className="mt-2 mb-0 text-xs leading-5 text-slate-400">{call.purpose}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 mb-0 rounded-lg border border-trust-mint/20 bg-trust-mint/10 p-3 text-xs leading-5 text-slate-300">
        No raw SQL, no PII, no secrets, no stack traces, no internal headers. All
        answers are sanitized before entering the AI context.
      </p>
    </section>
  );
}

function TrustConsoleSkeleton() {
  return (
    <section className={`${surface} grid gap-4 p-5`} aria-label="Loading Trust Operations">
      <div className="h-5 w-56 animate-pulse rounded bg-slate-800" />
      <div className="h-10 w-full max-w-3xl animate-pulse rounded bg-slate-800" />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className={`${innerSurface} h-40 animate-pulse`} key={index} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className={`${innerSurface} h-64 animate-pulse`} />
        <div className={`${innerSurface} h-64 animate-pulse`} />
      </div>
    </section>
  );
}
