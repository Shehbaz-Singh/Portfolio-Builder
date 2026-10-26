import { Router } from 'express';
import {
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  registerSchema,
} from '@portfolio/shared';
import { changePassword, deleteAccount, login, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validateBody(registerSchema), register);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login);
authRouter.get('/me', requireAuth, me);

// Both check the password again, so wrong guesses share the login limiter (failed tries only).
authRouter.post(
  '/change-password',
  requireAuth,
  loginLimiter,
  validateBody(changePasswordSchema),
  changePassword,
);
authRouter.delete(
  '/me',
  requireAuth,
  loginLimiter,
  validateBody(deleteAccountSchema),
  deleteAccount,
);
