import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

// Reads "Authorization: Bearer <jwt>", checks the user still exists and sets req.user.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const [scheme, token, ...rest] = (req.headers.authorization ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const userId = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw AppError.unauthorized('Account no longer exists', 'INVALID_TOKEN');

  req.user = user;
  next();
});
