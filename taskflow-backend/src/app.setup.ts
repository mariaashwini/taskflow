import type { INestApplication, LogLevel as NestLogLevel } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { API_PREFIX, ERROR_CODES, type ErrorResponse } from '@taskflow/shared';
import { DEFAULT_MESSAGES } from './common/filters/all-exceptions.filter.js';
import { AppLogger } from './common/logging/app-logger.js';
import { requestIdMiddleware } from './common/logging/request-id.middleware.js';
import { AppConfigService } from './config/app-config.service.js';
import type { LogLevel } from './config/env.validation.js';

/**
 * Our LOG_LEVEL names → the NestJS levels to print. Each level includes the
 * more serious ones. NestJS calls "info" `log`; request lines use it.
 */
const NEST_LOG_LEVELS: Record<LogLevel, NestLogLevel[]> = {
  error: ['fatal', 'error'],
  warn: ['fatal', 'error', 'warn'],
  info: ['fatal', 'error', 'warn', 'log'],
  debug: ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'],
};

/** Shared by main.ts and the e2e tests, so tests run the app exactly as it really starts. */
export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  // Readable text locally (UTC timestamps); one JSON object per line in production, for log tools.
  // Start-up lines buffered so far (main.ts: bufferLogs) are printed with this logger.
  app.useLogger(
    new AppLogger({
      logLevels: NEST_LOG_LEVELS[config.logLevel],
      json: config.nodeEnv === 'production',
    }),
  );

  // First of all: give the request its ID, so everything after can use it.
  app.use(requestIdMiddleware);

  // Security headers (architecture: "Security headers").
  app.use(
    helmet({
      // Helmet's defaults, plus: no other site may show TaskFlow in a frame.
      contentSecurityPolicy: { directives: { frameAncestors: ["'none'"] } },
      // The same rule for older browsers that only understand X-Frame-Options.
      frameguard: { action: 'deny' },
      // Force HTTPS only in production; locally we use plain http.
      hsts: config.nodeEnv === 'production',
    }),
  );

  // Private task data must never be kept by shared caches or the Back button.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Paths outside /api never reach NestJS, so Express would answer with its
  // own HTML page that repeats the path. Answer them with our standard 404.
  // Lowercased because Express matches routes case-insensitively (/API/health
  // must still reach NestJS).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.path.toLowerCase();
    if (path === API_PREFIX || path.startsWith(`${API_PREFIX}/`)) {
      next();
      return;
    }
    const body: ErrorResponse = {
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: DEFAULT_MESSAGES.NOT_FOUND,
        requestId: req.requestId ?? 'unknown',
      },
    };
    res.status(404).json(body);
  });

  // Every route starts with /api.
  app.setGlobalPrefix(API_PREFIX);
}
