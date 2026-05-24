import type { SagaStepStatus, SagaWorkflowStep } from '../../types/saga';

interface WorkflowTimelineProps {
  title: string;
  description: string;
  steps: SagaWorkflowStep[];
  variant: 'primary' | 'compensation';
}

const statusLabels: Record<SagaStepStatus, string> = {
  pendente: 'pendente',
  em_execucao: 'em execução',
  concluido: 'concluído',
  falhou: 'falhou',
  compensado: 'compensado',
};

export function WorkflowTimeline({
  title,
  description,
  steps,
  variant,
}: WorkflowTimelineProps) {
  return (
    <section className={`workflow-timeline workflow-timeline--${variant}`}>
      <div className="workflow-timeline__intro">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <ol className="workflow-timeline__steps">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`workflow-step workflow-step--${step.status} workflow-step--${step.health}`}
          >
            <div className="workflow-step__marker">{step.order}</div>
            <div className="workflow-step__content">
              <div className="workflow-step__title-row">
                <h4>{step.title}</h4>
                <span>{statusLabels[step.status]}</span>
              </div>
              <dl>
                <div>
                  <dt>Servico</dt>
                  <dd>{step.serviceOwner}</dd>
                </div>
                <div>
                  <dt>Tentativas</dt>
                  <dd>{step.attempts}</dd>
                </div>
                <div>
                  <dt>Correlacao</dt>
                  <dd>{step.correlationId}</dd>
                </div>
                <div>
                  <dt>Duracao</dt>
                  <dd>{step.durationMs > 0 ? `${step.durationMs} ms` : 'aguardando'}</dd>
                </div>
                <div>
                  <dt>Sinal</dt>
                  <dd>{step.observabilitySignal}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
