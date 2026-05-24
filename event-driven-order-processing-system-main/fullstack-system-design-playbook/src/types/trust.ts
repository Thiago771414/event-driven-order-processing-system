import type { AiOpsHealth, AiOpsTone, McpToolCall, McpToolName } from './aiOps';

export type TrustRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export type CommunicationChannel =
  | 'status-page'
  | 'in-app'
  | 'support-note'
  | 'ops-brief'
  | 'none';

export interface TrustMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  tone: AiOpsTone;
  explanation: string;
}

export interface CustomerReliabilitySignal {
  id: string;
  title: string;
  source: McpToolName;
  technicalSignal: string;
  customerSignal: string;
  operationalMeaning: string;
  status: AiOpsHealth;
  confidence: number;
}

export interface TransparencyFeedItem {
  id: string;
  time: string;
  title: string;
  customerMessage: string;
  internalCause: string;
  channel: CommunicationChannel;
  risk: TrustRiskLevel;
  status: 'drafted' | 'sent' | 'suppressed' | 'watching';
  ticketDeflection: string;
}

export interface JourneyImpactSegment {
  id: string;
  stage: string;
  signal: string;
  customerExpectation: string;
  trustImpact: string;
  status: AiOpsHealth;
}

export interface ExperienceGuardrail {
  id: string;
  title: string;
  policy: string;
  threshold: string;
  current: string;
  action: string;
  status: AiOpsHealth;
}

export interface TrustAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  title?: string;
  content: string;
  evidence?: string[];
  toolCalls?: McpToolCall[];
  blocked?: boolean;
}

export interface TrustOperationsSnapshot {
  generatedAt: string;
  trustScore: number;
  headline: string;
  narrative: string;
  mcpEvidence: McpToolCall[];
  metrics: TrustMetric[];
  reliabilitySignals: CustomerReliabilitySignal[];
  transparencyFeed: TransparencyFeedItem[];
  journeyImpact: JourneyImpactSegment[];
  guardrails: ExperienceGuardrail[];
  suggestedQuestions: string[];
}
