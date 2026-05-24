import type { ArchitectureHealth } from './architecture';

export type SagaStepStatus =
  | 'pendente'
  | 'em_execucao'
  | 'concluido'
  | 'falhou'
  | 'compensado';

export type SagaWorkflowTrack = 'happy_path' | 'compensation';

export interface SagaWorkflowStep {
  id: string;
  order: number;
  title: string;
  status: SagaStepStatus;
  serviceOwner: string;
  attempts: number;
  correlationId: string;
  durationMs: number;
  observabilitySignal: string;
  health: ArchitectureHealth;
}

export interface SagaWorkflowSummary {
  workflowId: string;
  correlationId: string;
  orchestrator: string;
  engineMode: string;
  status: string;
  totalDuration: string;
}

export interface SagaWorkflowModel {
  name: string;
  description: string;
  summary: SagaWorkflowSummary;
  happyPath: SagaWorkflowStep[];
  compensationPath: SagaWorkflowStep[];
}
