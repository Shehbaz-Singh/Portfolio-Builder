import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from './config';
import { AppError } from './errors';
import { ERRORS } from './messages';

const ALGORITHM = 'HS256';

export function signToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// Returns the user id the token was issued for, or throws a 401 AppError.
export function verifyToken(token: string): string {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });
    if (typeof payload === 'string' || !payload.sub) {
      throw AppError.unauthorized(ERRORS.invalidToken, 'INVALID_TOKEN');
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized(ERRORS.tokenExpired, 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized(ERRORS.invalidToken, 'INVALID_TOKEN');
  }
}
