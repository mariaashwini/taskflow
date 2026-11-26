import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { AppConfigService } from './config/app-config.service.js';

async function bootstrap() {
  // Store and compare all times in UTC. This is the first thing that runs
  // (imports only load code); CI and production also set TZ=UTC themselves.
  process.env.TZ = 'UTC';

  // Hold start-up log lines until setupApp() installs our logger, so they too
  // follow LOG_LEVEL and the production JSON format.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // Close the database pool cleanly when the process is stopped (Ctrl+C, deploys).
  app.enableShutdownHooks();
  setupApp(app);
  await app.listen(app.get(AppConfigService).port);
}
await bootstrap();
