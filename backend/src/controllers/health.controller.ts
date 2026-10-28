import type { Request, Response } from 'express';
import type { HealthResponse } from '@parichay/shared';

export function getHealth(_req: Request, res: Response<HealthResponse>) {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
}
