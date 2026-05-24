export type ArchitectureHealth = 'healthy' | 'warning' | 'critical' | 'idle';

export type ArchitectureMetricTone = 'positive' | 'neutral' | 'negative';

export interface ArchitectureMetric {
  label: string;
  value: string;
  trend?: string;
  tone: ArchitectureMetricTone;
}

export interface ArchitectureCardModel {
  id: string;
  title: string;
  category: string;
  summary: string;
  statusLabel: string;
  health: ArchitectureHealth;
  owner: string;
  signal: string;
  metrics: ArchitectureMetric[];
}

export interface ObservabilitySignal {
  label: string;
  value: string;
  detail: string;
  health: ArchitectureHealth;
}

export interface CanaryHealth {
  release: string;
  trafficShare: string;
  errorBudget: string;
  latencyP95: string;
  decision: string;
}

export interface KafkaTopicSnapshot {
  topic: string;
  lag: string;
  partitions: number;
  consumerGroup: string;
}

export interface ArchitectureConsoleSnapshot {
  generatedAt: string;
  environment: string;
  releaseTrack: string;
  cards: ArchitectureCardModel[];
  observabilitySignals: ObservabilitySignal[];
  canary: CanaryHealth;
  kafka: KafkaTopicSnapshot;
}
