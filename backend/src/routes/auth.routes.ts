import { Router } from 'express';
import { loginSchema, registerSchema } from '@portfolio/shared';
import { login, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validateBody(registerSchema), register);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login);
authRouter.get('/me', requireAuth, me);
