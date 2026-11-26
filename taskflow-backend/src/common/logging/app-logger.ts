import { ConsoleLogger } from '@nestjs/common';

/**
 * NestJS's ConsoleLogger with UTC timestamps in text mode.
 *
 * The built-in timestamp uses a date formatter that NestJS creates when its
 * code is imported, which is before main.ts sets TZ=UTC, so it would show the
 * computer's local time. ISO 8601 (e.g. 2026-11-26T14:21:50.123Z) is always
 * UTC and unambiguous. JSON mode (production) is unaffected: it logs a number.
 */
export class AppLogger extends ConsoleLogger {
  protected override getTimestamp(): string {
    return new Date().toISOString();
  }
}
