import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './otel';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);

  console.log(`[API] Listening on http://localhost:${port}`);
}

void bootstrap();
