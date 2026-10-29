import { Router } from 'express';
import { HONEYPOT_FIELD, testimonialSubmissionSchema } from '@parichay/shared';
import {
  getPublicPost,
  getPublicPosts,
  getPublicProfile,
  getSiteInfo,
  getSitemapLocales,
  getSitemapPosts,
  submitTestimonial,
} from '../controllers/public.controller';
import { honeypot } from '../middleware/honeypot';
import { testimonialLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';

// No authentication: this is what the public /[username] page reads and posts to.
export const publicRouter = Router();

// Not a slug (they cannot start with an underscore), so it cannot clash with one.
publicRouter.get('/_info', getSiteInfo);
publicRouter.get('/_posts', getSitemapPosts);
publicRouter.get('/_locales', getSitemapLocales);
publicRouter.get('/:slug', getPublicProfile);
publicRouter.get('/:slug/posts', getPublicPosts);
publicRouter.get('/:slug/posts/:postSlug', getPublicPost);
// Rate limit first, then the honeypot (a bot's request is dropped before it is read), then the
// body is validated.
publicRouter.post(
  '/:slug/testimonials',
  testimonialLimiter,
  honeypot(HONEYPOT_FIELD),
  validateBody(testimonialSubmissionSchema),
  submitTestimonial,
);
