import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../config/app-config.service.js';
import { DatabaseHealth } from './database-health.js';
import { buildDataSourceOptions } from './data-source-options.js';

/**
 * Opens the app's connection pool to MariaDB at start-up.
 *
 * forRootAsync waits until AppConfigService exists (settings validated),
 * then builds the options. If MariaDB isn't reachable, @nestjs/typeorm
 * retries a few times before the app stops with a connection error.
 * NestJS closes the pool when the app shuts down.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => buildDataSourceOptions(config.db),
    }),
  ],
  providers: [DatabaseHealth],
  exports: [DatabaseHealth],
})
export class DatabaseModule {}
