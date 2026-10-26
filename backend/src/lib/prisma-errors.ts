import { Prisma } from '../generated/prisma/client';

const hasCode = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

// A unique constraint (email, slug) was violated.
export const isUniqueViolation = (err: unknown) => hasCode(err, 'P2002');

// An update or delete matched no row.
export const isRecordNotFound = (err: unknown) => hasCode(err, 'P2025');

// Runs an update or delete and turns "matched no row" into the given 404.
export async function orNotFound<T>(run: Promise<T>, notFound: () => Error): Promise<T> {
  try {
    return await run;
  } catch (err) {
    if (isRecordNotFound(err)) throw notFound();
    throw err;
  }
}
