import { performance } from 'node:perf_hooks';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { redact } from '../logging/redact.js';

/** One request line. Only these fields: never the raw URL, query string, body or headers. */
interface RequestLogEntry {
  requestId: string;
  method: string;
  /** The route pattern, e.g. '/api/tasks/:id', never the real path with its values. */
  route: string;
  status: number;
  durationMs: number;
}

/**
 * Writes one log entry per request, after the response has been fully sent,
 * so the status is final (including statuses set by the exception filter).
 *
 * NestJS runs interceptors only for requests that reach a route, so unknown
 * routes get no request line; the exception filter still logs server errors.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const started = performance.now();

    res.once('finish', () => {
      const entry: RequestLogEntry = {
        requestId: req.requestId ?? 'unknown',
        method: req.method,
        route: routePatternOf(req),
        status: res.statusCode,
        durationMs: Math.round(performance.now() - started),
      };
      this.logger.log(redact(entry));
    });

    return next.handle();
  }
}

/** Express sets req.route to the matched route; its `path` is the pattern, not the real URL. */
function routePatternOf(req: Request): string {
  const route: unknown = req.route;
  if (typeof route === 'object' && route !== null && 'path' in route && typeof route.path === 'string') {
    return route.path;
  }
  return 'unknown';
}
