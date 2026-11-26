import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** How long the health check waits for MariaDB before calling it down. */
const PING_TIMEOUT_MS = 2000;

/**
 * "Can we reach MariaDB?" Lives in src/database because it needs TypeORM,
 * which feature modules may not import directly.
 */
@Injectable()
export class DatabaseHealth {
  constructor(private readonly dataSource: DataSource) {}

  /** true if `SELECT 1` answers within 2 seconds; false on any error or timeout. */
  async isUp(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database ping timed out')), PING_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.dataSource.query('SELECT 1'), timeout]);
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
