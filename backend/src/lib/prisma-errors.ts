import { Prisma } from '../generated/prisma/client';

const hasCode = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

// A unique constraint (email, slug) was violated.
export const isUniqueViolation = (err: unknown) => hasCode(err, 'P2002');

// An update or delete matched no row.
export const isRecordNotFound = (err: unknown) => hasCode(err, 'P2025');
