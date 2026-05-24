import type {
  ArchitectureConsoleSnapshot,
  ObservabilitySignal,
} from '../../types/architecture';

interface ObservabilityPanelProps {
  snapshot: ArchitectureConsoleSnapshot;
}

export function ObservabilityPanel({ snapshot }: ObservabilityPanelProps) {
  return (
    <section className="observability-panel" aria-labelledby="observability-title">
      <div className="section-heading">
        <span className="eyebrow">Signals</span>
        <h2 id="observability-title">Observabilidade e rollout</h2>
        <p>
          Dados simulados para mostrar como operadores poderiam investigar a
          saude do checkout, do Kafka, da DLQ e da versao canary.
        </p>
      </div>

      <div className="operations-grid">
        <article className="operation-card">
          <span className="operation-card__label">Kafka</span>
          <h3>{snapshot.kafka.topic}</h3>
          <dl>
            <div>
              <dt>Lag</dt>
              <dd>{snapshot.kafka.lag}</dd>
            </div>
            <div>
              <dt>Particoes</dt>
              <dd>{snapshot.kafka.partitions}</dd>
            </div>
            <div>
              <dt>Grupo</dt>
              <dd>{snapshot.kafka.consumerGroup}</dd>
            </div>
          </dl>
        </article>

        <article className="operation-card">
          <span className="operation-card__label">Canary</span>
          <h3>{snapshot.canary.release}</h3>
          <dl>
            <div>
              <dt>Trafego</dt>
              <dd>{snapshot.canary.trafficShare}</dd>
            </div>
            <div>
              <dt>Erro budget</dt>
              <dd>{snapshot.canary.errorBudget}</dd>
            </div>
            <div>
              <dt>P95</dt>
              <dd>{snapshot.canary.latencyP95}</dd>
            </div>
            <div>
              <dt>Decisao</dt>
              <dd>{snapshot.canary.decision}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="signal-grid">
        {snapshot.observabilitySignals.map((signal) => (
          <SignalCard key={signal.label} signal={signal} />
        ))}
      </div>
    </section>
  );
}

function SignalCard({ signal }: { signal: ObservabilitySignal }) {
  return (
    <article className={`signal-card signal-card--${signal.health}`}>
      <div>
        <span>{signal.label}</span>
        <strong>{signal.value}</strong>
      </div>
      <p>{signal.detail}</p>
    </article>
  );
}
