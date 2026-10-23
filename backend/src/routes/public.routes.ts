import { Router } from 'express';
import { getPublicProfile } from '../controllers/public.controller';

// No authentication: this is what the public /[username] page reads.
export const publicRouter = Router();

publicRouter.get('/:slug', getPublicProfile);
