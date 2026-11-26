import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables, LogLevel, NodeEnv } from './env.validation.js';

/** Database settings, grouped so the database code receives one object. */
export interface DbConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
}

/**
 * The only way application code reads settings. Values were checked and
 * converted by `validate()` at start-up, so every getter returns the right type.
 */
@Injectable()
export class AppConfigService {
  // `true` tells ConfigService the values were validated, so `get` never returns undefined.
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv(): NodeEnv {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get logLevel(): LogLevel {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get db(): DbConfig {
    return {
      host: this.config.get('DB_HOST', { infer: true }),
      port: this.config.get('DB_PORT', { infer: true }),
      name: this.config.get('DB_NAME', { infer: true }),
      user: this.config.get('DB_USER', { infer: true }),
      password: this.config.get('DB_PASSWORD', { infer: true }),
      ssl: this.config.get('DB_SSL', { infer: true }),
    };
  }
}
