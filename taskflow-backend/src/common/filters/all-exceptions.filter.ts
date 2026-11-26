import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ERROR_CODES, type ErrorCode, type ErrorResponse } from '@taskflow/shared';
import { redact } from '../logging/redact.js';

/**
 * Safe, generic messages, used whenever we didn't write a message ourselves.
 * Also used by the non-/api catch-all in app.setup.ts.
 */
export const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'The request is not valid.',
  NOT_FOUND: 'Not found.',
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
};

/** What our own code puts into an exception, e.g. new NotFoundException({ code: 'NOT_FOUND' }). */
interface OwnPayload {
  code: string;
  message?: string;
  fields?: { field: string; message: string }[];
}

/**
 * Turns every error into the standard ErrorResponse shape and logs it safely.
 * Never sends a stack trace or internal details to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = req.requestId ?? randomUUID();

    const status = statusOf(exception);
    const own = ownPayloadOf(exception);
    const code = own?.code ?? codeForStatus(status);
    const message = own?.message ?? DEFAULT_MESSAGES[codeForStatus(status)];

    if (status >= 500) {
      this.logServerError(exception, requestId);
    }

    // The response may already be on its way (e.g. an error while streaming).
    if (res.headersSent) {
      return;
    }

    const body: ErrorResponse = {
      error: { code, message, ...(own?.fields ? { fields: own.fields } : {}), requestId },
    };
    res.status(status).json(body);
  }

  private logServerError(exception: unknown, requestId: string): void {
    const type = exception instanceof Error ? exception.name : typeof exception;
    const dbCode = databaseErrorCode(exception);

    if (dbCode !== undefined) {
      // MariaDB messages can contain the submitted value: log only the driver code.
      this.logger.error(redact({ requestId, type, code: dbCode }));
      return;
    }

    const message = exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(redact({ requestId, type, message }), stack);
  }
}

/** HttpException → its status; an Express error with a 4xx status → that status; anything else → 500. */
function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  if (isObject(exception)) {
    const status = exception['status'] ?? exception['statusCode'];
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return status;
    }
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/** Option A: 404 → NOT_FOUND, 5xx → INTERNAL_ERROR, any other 4xx → VALIDATION_FAILED. */
function codeForStatus(status: number): ErrorCode {
  if (status === 404) return ERROR_CODES.NOT_FOUND;
  if (status >= 500) return ERROR_CODES.INTERNAL_ERROR;
  return ERROR_CODES.VALIDATION_FAILED;
}

/** The payload, only if our own code threw the exception with a `code`. */
function ownPayloadOf(exception: unknown): OwnPayload | undefined {
  if (!(exception instanceof HttpException)) return undefined;
  const response = exception.getResponse();
  if (!isObject(response) || typeof response['code'] !== 'string') return undefined;

  const message = response['message'];
  const fields = response['fields'];
  return {
    code: response['code'],
    ...(typeof message === 'string' ? { message } : {}),
    ...(Array.isArray(fields) ? { fields: fields as OwnPayload['fields'] } : {}),
  };
}

/**
 * The MariaDB driver code (e.g. 'ER_DUP_ENTRY') if this is a database error,
 * otherwise undefined. Recognised by shape, because only src/database may
 * import TypeORM (whose QueryFailedError wraps the driver error).
 */
function databaseErrorCode(exception: unknown): string | undefined {
  if (!isObject(exception)) return undefined;
  const driverError = exception['driverError'];
  const source = isObject(driverError) ? driverError : exception;
  const isDbError = 'driverError' in exception || 'sqlState' in source || 'sqlMessage' in source;
  const code = source['code'];
  return isDbError && typeof code === 'string' ? code : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
