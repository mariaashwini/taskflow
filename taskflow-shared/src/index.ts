/**
 * Prefix of every API route.
 *
 * The backend uses it as its global route prefix; the frontend uses it for
 * RTK Query's baseApi and the Vite development proxy. Keeping it here means
 * the two sides can never disagree.
 */
export const API_PREFIX = '/api';

export type { ErrorResponse, HealthResponse } from './api-types.js';
export { ERROR_CODES, type ErrorCode } from './error-codes.js';
