import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service.js';
import { validate } from './env.validation.js';

/**
 * Loads `.env` (if present), validates every variable once at start-up and
 * makes AppConfigService available everywhere (@Global), so feature modules
 * don't need to import this module themselves.
 *
 * Real environment variables win over `.env`, which is how production and CI
 * supply their values.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '.env', validate })],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
