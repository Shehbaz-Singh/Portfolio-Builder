import { Router } from 'express';
import { authRouter } from './auth.routes';
import { healthRouter } from './health.routes';
import { profileRouter } from './profile.routes';
import { publicRouter } from './public.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/public', publicRouter);
