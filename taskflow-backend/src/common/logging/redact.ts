/** What replaces a sensitive value. */
export const REDACTED = '[REDACTED]';

/** What replaces an object that contains itself, so redact() never loops forever. */
export const CIRCULAR = '[Circular]';

/**
 * The architecture's list of keys whose values must never reach a log.
 * Stored in lower case, because keys are compared ignoring letter case
 * (headers arrive as `authorization`, our own code may write `Authorization`).
 */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set(
  [
    'password',
    'newPassword',
    'token',
    'csrfToken',
    'tokenHash',
    'passwordHash',
    'authorization',
    'cookie',
    'set-cookie',
    'x-csrf-token',
  ].map((key) => key.toLowerCase()),
);

/**
 * Safety net for log entries: returns a copy of `value` in which the value of
 * every sensitive key, at any depth, is replaced with '[REDACTED]'.
 * The original is never changed. Our logging rules keep secrets out of log
 * entries in the first place; this catches mistakes.
 */
export function redact(value: unknown): unknown {
  return copyRedacted(value, new WeakSet<object>());
}

/**
 * `ancestors` holds the objects we are currently inside. Meeting one of them
 * again means a circle; meeting the same object in two separate places is fine.
 */
function copyRedacted(value: unknown, ancestors: WeakSet<object>): unknown {
  if (typeof value !== 'object' || value === null) {
    return value; // strings, numbers, booleans, undefined, ...
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (ancestors.has(value)) {
    return CIRCULAR;
  }

  ancestors.add(value);
  let copy: unknown;
  if (Array.isArray(value)) {
    copy = value.map((item: unknown) => copyRedacted(item, ancestors));
  } else {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : copyRedacted(item, ancestors);
    }
    copy = result;
  }
  ancestors.delete(value);
  return copy;
}
