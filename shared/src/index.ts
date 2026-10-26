import { z } from 'zod';

// Shared Zod schemas and types live here. Feature schemas get added per task.

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export * from './portfolio';
export * from './public';
export * from './auth';
export * from './errors';

export * from './resume';
