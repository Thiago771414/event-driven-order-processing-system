import type { ArchitectureConsoleSnapshot } from '../../types/architecture';
import type { SagaWorkflowModel } from '../../types/saga';
import { ArchitectureCard } from './ArchitectureCard';
import { ObservabilityPanel } from './ObservabilityPanel';
import { SagaOrchestratorPanel } from './SagaOrchestratorPanel';

interface ArchitectureConsoleProps {
  snapshot: ArchitectureConsoleSnapshot;
  workflow: SagaWorkflowModel;
}

export function ArchitectureConsole({
  snapshot,
  workflow,
}: ArchitectureConsoleProps) {
  return (
    <section className="architecture-console" aria-labelledby="console-title">
      <div className="console-header">
        <div>
          <span className="eyebrow">Distributed architecture map</span>
          <h2 id="console-title">Arquitetura distribuida do MiniShop</h2>
          <p>
            Visao operacional do fluxo de checkout: HTTP edge, outbox, Kafka,
            workers, Redis, DLQ, observabilidade, rollout canary e saga
            inspirada no Netflix Conductor.
          </p>
        </div>
        <dl className="console-header__meta">
          <div>
            <dt>Ambiente</dt>
            <dd>{snapshot.environment}</dd>
          </div>
          <div>
            <dt>Release</dt>
            <dd>{snapshot.releaseTrack}</dd>
          </div>
          <div>
            <dt>Snapshot</dt>
            <dd>{snapshot.generatedAt}</dd>
          </div>
        </dl>
      </div>

      <div className="architecture-card-grid">
        {snapshot.cards.map((card) => (
          <ArchitectureCard key={card.id} card={card} />
        ))}
      </div>

      <ObservabilityPanel snapshot={snapshot} />
      <SagaOrchestratorPanel workflow={workflow} />
    </section>
  );
}
