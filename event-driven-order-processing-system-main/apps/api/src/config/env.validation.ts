type EnvConfig = Record<string, unknown>;

export function validateApiEnv(config: EnvConfig) {
  const missing: string[] = [];
  const postgresUrl = readEnv(config, 'POSTGRES_URL');
  const kafkaBrokers = readEnv(config, 'KAFKA_BROKERS');
  const legacyKafkaBroker = readEnv(config, 'KAFKA_BROKER');

  if (!postgresUrl) {
    missing.push('POSTGRES_URL');
  }

  if (!kafkaBrokers && !legacyKafkaBroker) {
    missing.push('KAFKA_BROKERS or KAFKA_BROKER');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(
        ', ',
      )}. Create a repository-root .env from .env.example for local development.`,
    );
  }

  if (!kafkaBrokers && legacyKafkaBroker) {
    config.KAFKA_BROKERS = legacyKafkaBroker;
    process.env.KAFKA_BROKERS = legacyKafkaBroker;
  }

  if (!legacyKafkaBroker && kafkaBrokers) {
    const firstBroker = kafkaBrokers.split(',')[0]?.trim();
    if (firstBroker) {
      config.KAFKA_BROKER = firstBroker;
      process.env.KAFKA_BROKER = firstBroker;
    }
  }

  return config;
}

function readEnv(config: EnvConfig, name: string) {
  const value = config[name];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}
