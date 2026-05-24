import type { SagaWorkflowModel } from '../../types/saga';
import { WorkflowTimeline } from './WorkflowTimeline';

interface SagaOrchestratorPanelProps {
  workflow: SagaWorkflowModel;
}

export function SagaOrchestratorPanel({ workflow }: SagaOrchestratorPanelProps) {
  return (
    <section className="saga-panel" aria-labelledby="saga-panel-title">
      <div className="section-heading">
        <span className="eyebrow">Saga orchestration</span>
        <h2 id="saga-panel-title">Orquestrador de Sagas</h2>
        <p>{workflow.description}</p>
      </div>

      <dl className="saga-summary">
        <div>
          <dt>Workflow</dt>
          <dd>{workflow.summary.workflowId}</dd>
        </div>
        <div>
          <dt>Orquestrador</dt>
          <dd>{workflow.summary.orchestrator}</dd>
        </div>
        <div>
          <dt>Modo</dt>
          <dd>{workflow.summary.engineMode}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{workflow.summary.status}</dd>
        </div>
        <div>
          <dt>Duracao total</dt>
          <dd>{workflow.summary.totalDuration}</dd>
        </div>
        <div>
          <dt>Correlation ID</dt>
          <dd>{workflow.summary.correlationId}</dd>
        </div>
      </dl>

      <div className="workflow-layout">
        <WorkflowTimeline
          title="Fluxo feliz de checkout"
          description="Caminho simulado em que o pagamento e confirmado e o pedido segue para publicacao."
          steps={workflow.happyPath}
          variant="primary"
        />
        <WorkflowTimeline
          title="Caminho de compensacao"
          description="Cenario didatico em que uma falha apos pagamento autorizado dispara reembolso e cancelamento."
          steps={workflow.compensationPath}
          variant="compensation"
        />
      </div>
    </section>
  );
}
