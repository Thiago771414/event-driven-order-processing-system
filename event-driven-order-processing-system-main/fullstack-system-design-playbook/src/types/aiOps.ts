export type AiOpsHealth =
  | 'healthy'
  | 'degraded'
  | 'warning'
  | 'critical'
  | 'blocked';

export type AiOpsTone = 'good' | 'neutral' | 'warn' | 'bad';

export type McpToolName =
  | 'queryPrometheusMetrics'
  | 'getKafkaLag'
  | 'getDLQStats'
  | 'getTraceSummary'
  | 'getCanaryHealth'
  | 'getWorkerHealth'
  | 'getRetryMetrics'
  | 'getPublicSystemStatus';

export interface McpToolCall {
  id: string;
  tool: McpToolName;
  status: 'allowed' | 'denied';
  durationMs: number;
  policy: string;
  purpose: string;
  summary: string;
}

export interface McpPolicyControl {
  label: string;
  state: 'enforced' | 'monitoring' | 'blocked';
  detail: string;
}

export interface AiMetricCard {
  id: string;
  label: string;
  value: string;
  unit?: string;
  trend: string;
  tone: AiOpsTone;
  source: McpToolName;
  narrative: string;
  series: number[];
}

export interface SystemHealthNode {
  id: string;
  label: string;
  tier: string;
  status: AiOpsHealth;
  latencyP95: string;
  saturation: string;
  throughput: string;
  owner: string;
}

export interface KafkaFlowStage {
  id: string;
  label: string;
  detail: string;
  metric: string;
  status: AiOpsHealth;
}

export interface WorkerHealthSnapshot {
  name: string;
  status: AiOpsHealth;
  cpu: string;
  eventLoopLag: string;
  queueDepth: string;
  concurrency: string;
}

export interface DlqSnapshot {
  openMessages: number;
  oldestAge: string;
  dominantReason: string;
  replaySafety: string;
}

export interface CanaryRiskFactor {
  label: string;
  value: string;
  tone: AiOpsTone;
}

export interface CanaryAnalysis {
  release: string;
  trafficShare: string;
  decision: string;
  reliabilityScore: number;
  riskFactors: CanaryRiskFactor[];
}

export interface RetryIdempotencyInsight {
  label: string;
  value: string;
  detail: string;
  tone: AiOpsTone;
}

export interface TraceTimelineEvent {
  time: string;
  service: string;
  operation: string;
  duration: string;
  status: AiOpsHealth;
  detail: string;
}

export interface IncidentTimelineItem {
  id: string;
  time: string;
  title: string;
  severity: 'SEV3' | 'SEV2' | 'SEV1';
  status: 'active' | 'watching' | 'mitigated';
  summary: string;
  hypothesis: string;
  recommendation: string;
  correlatedSignals: string[];
}

export interface OperationalRecommendation {
  id: string;
  title: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AiAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  title?: string;
  content: string;
  reasoningSteps?: string[];
  toolCalls?: McpToolCall[];
  recommendations?: string[];
  blocked?: boolean;
}

export interface AiOpsConsoleSnapshot {
  generatedAt: string;
  globalStatus: AiOpsHealth;
  reliabilityScore: number;
  summary: string;
  controlPlane: {
    name: string;
    mode: string;
    policy: string;
    allowedTools: McpToolName[];
    deniedCapabilities: string[];
    controls: McpPolicyControl[];
  };
  metrics: AiMetricCard[];
  healthNodes: SystemHealthNode[];
  kafkaFlow: KafkaFlowStage[];
  workerHealth: WorkerHealthSnapshot[];
  dlq: DlqSnapshot;
  canary: CanaryAnalysis;
  retryInsights: RetryIdempotencyInsight[];
  traceTimeline: TraceTimelineEvent[];
  incidents: IncidentTimelineItem[];
  recommendations: OperationalRecommendation[];
  suggestedQueries: string[];
}
