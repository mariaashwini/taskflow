/**
 * Entry point for the TypeORM migration commands only (`npm run migration:*`,
 * which run the compiled dist/database/data-source.js). The app never imports
 * this file: it connects through DatabaseModule instead.
 *
 * Loading this file reads `.env`, so it must stay out of the app's imports.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { validate } from '../config/env.validation.js';
import { buildDataSourceOptions } from './data-source-options.js';

// Locally the settings come from `.env`; in CI and production there is no
// such file and the real environment variables are used instead.
try {
  process.loadEnvFile('.env');
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

// The same checks as the app's start-up: stops with a clear message if a
// variable is missing or invalid.
const env = validate(process.env);

export default new DataSource(
  buildDataSourceOptions({
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
  }),
);
