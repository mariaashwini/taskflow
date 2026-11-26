/**
 * Every `error.code` the API can return (architecture, "Errors").
 * Use these constants instead of typing the text, so a typo is a compile error.
 * More codes (UNAUTHENTICATED, CSRF_INVALID, ...) arrive with M2.
 */
export const ERROR_CODES = {
  /** 400: input breaks a rule; `fields` lists each problem. */
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  /** 404: missing, someone else's, or in the wrong place. */
  NOT_FOUND: 'NOT_FOUND',
  /** 500: anything unexpected. */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/** One of the codes above, e.g. 'NOT_FOUND'. */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
