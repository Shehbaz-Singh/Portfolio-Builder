import { rateLimit } from 'express-rate-limit';
import { AppError } from '../lib/errors';

function limiter(options: { windowMs: number; limit: number; skipSuccessfulRequests?: boolean }) {
  return rateLimit({
    ...options,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many attempts, please try again later')),
  });
}

// Only failed logins count, so normal use is never blocked but guessing passwords is.
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

export const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 10 });
