import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const releaseAttributes = {
  'service.version': process.env.APP_VERSION ?? 'dev',
  'deployment.version': process.env.DEPLOYMENT_VERSION ?? 'local',
  'release.track': process.env.RELEASE_TRACK ?? 'stable',
  'canary.cohort': process.env.CANARY_COHORT ?? 'none',
};

const existingResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES ?? '';
const missingReleaseAttributes = Object.entries(releaseAttributes)
  .filter(([key]) => !existingResourceAttributes.includes(`${key}=`))
  .map(([key, value]) => `${key}=${value}`)
  .join(',');

process.env.OTEL_RESOURCE_ATTRIBUTES = [
  existingResourceAttributes,
  missingReleaseAttributes,
]
  .filter(Boolean)
  .join(',');

export const otel = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

otel.start();
