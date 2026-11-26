import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@taskflow/shared';
import { DatabaseHealth } from '../../database/database-health.js';

/** Decides what "healthy" means: today, that the database answers. */
@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseHealth) {}

  async check(): Promise<HealthResponse> {
    const up = await this.database.isUp();
    return up ? { status: 'ok', database: 'up' } : { status: 'error', database: 'down' };
  }
}
