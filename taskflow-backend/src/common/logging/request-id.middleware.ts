import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// Tell TypeScript that every Express request may carry our request ID.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- the way Express types are extended
  namespace Express {
    interface Request {
      /** Random ID for this request; appears in error responses and log lines. */
      requestId?: string;
    }
  }
}

/**
 * Gives every request its own random ID before NestJS routing runs, so even
 * unknown routes get one. The filter returns it in error responses and the
 * logs record it, so a problem a user reports can be found in the log.
 *
 * It always creates a fresh ID and never trusts one sent by the client, so
 * nobody can plant misleading IDs in our logs.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  next();
}
