import type { Request } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { ERRORS } from '../lib/messages';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; profileId: string | null };
    }
  }
}

// Reads "Authorization: Bearer <jwt>", checks the user still exists and sets req.user.
// profileId comes from the same query, so profile routes need no extra lookup.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const [scheme, token, ...rest] = (req.headers.authorization ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    throw AppError.unauthorized(ERRORS.missingAuthHeader);
  }

  const userId = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, profile: { select: { id: true } } },
  });
  if (!user) throw AppError.unauthorized(ERRORS.accountGone, 'INVALID_TOKEN');

  req.user = { id: user.id, email: user.email, profileId: user.profile?.id ?? null };
  next();
});

// The signed-in user's profile id. Every profile query is scoped by it, which is what stops
// one user from reading or changing another user's records.
export function getProfileId(req: Request): string {
  const profileId = req.user?.profileId;
  if (!profileId) throw AppError.notFound(ERRORS.profileNotFound);
  return profileId;
}
