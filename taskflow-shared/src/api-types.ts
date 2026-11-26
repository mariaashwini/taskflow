/**
 * Shapes of API responses, shared by the backend (which sends them) and the
 * frontend (which reads them), so the two can never disagree.
 */

/**
 * Body of GET /api/health: 200 with 'ok' / 'up' when the database answers,
 * 503 with 'error' / 'down' when it doesn't. Reveals no versions or settings.
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

/** Body of every error response. Never contains a stack trace. */
export interface ErrorResponse {
  error: {
    /** Machine-readable, e.g. 'VALIDATION_FAILED' (see error-codes.ts). */
    code: string;
    /** Safe to show the user. */
    message: string;
    /** Only for VALIDATION_FAILED: one entry per invalid field. */
    fields?: { field: string; message: string }[];
    /** Matches the server log line, so a reported problem can be found. */
    requestId: string;
  };
}
