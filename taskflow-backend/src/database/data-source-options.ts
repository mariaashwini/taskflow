import type { DataSourceOptions } from 'typeorm';
import type { DbConfig } from '../config/app-config.service.js';

/**
 * The one place the database connection is described.
 * Used by DatabaseModule (the running app) and by data-source.ts (the
 * migration commands), so the two can never drift apart.
 *
 * This file only builds an object: importing it reads no files and opens
 * no connection.
 */
export function buildDataSourceOptions(db: DbConfig): DataSourceOptions {
  return {
    type: 'mariadb',
    host: db.host,
    port: db.port,
    username: db.user,
    password: db.password,
    database: db.name,
    charset: 'utf8mb4',
    // Timestamps are read and written as UTC.
    timezone: 'Z',
    // DATE columns (due dates) stay 'YYYY-MM-DD' strings instead of becoming
    // JavaScript Dates, which would shift them by the time zone.
    dateStrings: ['DATE'],
    // Listed one by one from M1; file patterns are fragile with ES modules.
    entities: [],
    // Compiled migration files; they only run through an explicit command.
    migrations: ['dist/database/migrations/*.js'],
    // Never change tables automatically: only reviewed migrations do that.
    synchronize: false,
    // Starting the app never runs migrations by surprise.
    migrationsRun: false,
    // No SQL statements or parameter values in the logs. 'error' is left out on
    // purpose: TypeORM would print the failed query with its parameter values.
    // Failed queries still reach the exception filter, which logs only the driver code.
    logging: ['warn', 'migration'],
    ssl: db.ssl ? { rejectUnauthorized: true } : undefined,
  };
}
