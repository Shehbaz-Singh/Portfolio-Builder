import { slugSchema } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import * as publicService from '../services/public.service';

// Short cache: edits show up within a minute, while a busy portfolio does not hit the
// database on every view. Express also adds an ETag, so revalidation costs a 304.
const CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

export const getPublicProfile = asyncHandler(async (req, res) => {
  // Anything that cannot be a valid slug (including reserved words) cannot be a profile.
  const slug = slugSchema.safeParse(req.params.slug as string);
  if (!slug.success) throw AppError.notFound('Profile not found');

  const profile = await publicService.getPublicProfile(slug.data);
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(profile);
});
