import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Environment variables are always strings. Turning 'false' into a boolean
 * with Boolean('false') would give `true`, so only the exact words count.
 * It reads the raw value from `obj`, because implicit conversion may already
 * have turned `value` into a boolean the wrong way.
 */
function toBoolean({ obj, key }: { obj: Record<string, unknown>; key: string }): unknown {
  const raw = obj[key];
  if (raw === 'true' || raw === true) return true;
  if (raw === 'false' || raw === false) return false;
  return raw;
}

/** Every environment variable the backend reads, with its rules. */
export class EnvironmentVariables {
  @IsIn(NODE_ENVS)
  NODE_ENV!: NodeEnv;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsIn(LOG_LEVELS)
  LOG_LEVEL!: LogLevel;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SSL!: boolean;
}

/**
 * Used by @nestjs/config at start-up (and by data-source.ts later).
 * Collects every problem and throws once, naming each variable.
 * The message never includes a variable's value, so a password can't leak.
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });

  if (errors.length > 0) {
    const problems = errors.map(
      (error) => `  - ${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`,
    );
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return env;
}
