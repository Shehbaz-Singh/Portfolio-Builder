import type { Prisma } from '../generated/prisma/client';
import { AppError } from './errors';
import { ERRORS } from './messages';
import { prisma } from './prisma';

type Db = Prisma.TransactionClient | typeof prisma;

// The signed-in owner's profile, narrowed to `select`. A profile that is gone (the account was
// deleted while a request was in flight) is a 404, the same as everywhere else.
export async function ownProfile<S extends Prisma.ProfileSelect>(
  profileId: string,
  select: S,
  db: Db = prisma,
) {
  const profile = await db.profile.findUnique({ where: { id: profileId }, select });
  if (!profile) throw AppError.notFound(ERRORS.profileNotFound);
  return profile;
}
