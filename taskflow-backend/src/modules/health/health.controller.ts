import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { HealthResponse } from '@taskflow/shared';
import { HealthService } from './health.service.js';

/** GET /api/health: public, reveals no versions or configuration. */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * 200 when everything is up, 503 when the database is down. The body keeps
   * the HealthResponse shape in both cases, so it doesn't throw (a thrown
   * error would turn into the standard error shape instead).
   * `passthrough: true` lets NestJS still send the returned body.
   */
  @Get()
  async get(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const result = await this.health.check();
    if (result.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
