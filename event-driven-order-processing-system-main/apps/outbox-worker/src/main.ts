import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './otel';
import { MetricsService } from './metrics/metrics.service';
import * as http from 'http';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('[OUTBOX-WORKER] Started');

  const metrics = app.get(MetricsService);
  const port = Number(process.env.METRICS_PORT ?? 9200);

  const server = http.createServer((req, res) => {
    if (req.url === '/metrics') {
      metrics
        .getMetrics()
        .then((text) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', metrics.contentType);
          res.end(text);
        })
        .catch(() => {
          res.statusCode = 500;
          res.end('error collecting metrics');
        });

      return;
    }

    res.statusCode = 404;
    res.end('not found');
  });

  server.listen(port, () => {
    console.log(`[OUTBOX-WORKER] Metrics on :${port}/metrics`);
  });
}

void bootstrap();
