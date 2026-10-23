import { Router } from 'express';
import { authRouter } from './auth.routes';
import { healthRouter } from './health.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
