import { Router } from 'express';
import { HONEYPOT_FIELD, testimonialSubmissionSchema } from '@portfolio/shared';
import { getPublicProfile, getSiteInfo, submitTestimonial } from '../controllers/public.controller';
import { honeypot } from '../middleware/honeypot';
import { testimonialLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

// No authentication: this is what the public /[username] page reads and posts to.
export const publicRouter = Router();

// Not a slug (they cannot start with an underscore), so it cannot clash with one.
publicRouter.get('/_info', getSiteInfo);
publicRouter.get('/:slug', getPublicProfile);
// Rate limit first, then the honeypot (a bot's request is dropped before it is read), then the
// body is validated.
publicRouter.post(
  '/:slug/testimonials',
  testimonialLimiter,
  honeypot(HONEYPOT_FIELD),
  validateBody(testimonialSubmissionSchema),
  submitTestimonial,
);
