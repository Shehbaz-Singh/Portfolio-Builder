import type { Prisma } from '../generated/prisma/client';

// Requests that queue behind a lock wait for it instead of failing after Prisma's 2 s default.
export const WAIT = { maxWait: 10_000, timeout: 15_000 };

// Serialises writers of one profile, so two requests at once cannot both pass a limit check.
export const lockProfile = (tx: Prisma.TransactionClient, profileId: string) =>
  tx.$queryRaw`SELECT 1 FROM "Profile" WHERE "id" = ${profileId} FOR UPDATE`;
