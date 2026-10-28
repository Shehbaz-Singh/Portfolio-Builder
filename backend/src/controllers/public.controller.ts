import type { Request } from 'express';
import { slugSchema, type TestimonialInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { config } from '../lib/config';
import { AppError } from '../lib/errors';
import * as publicService from '../services/public.service';
import * as testimonialService from '../services/testimonial.service';

// Short cache: edits show up within a minute, while a busy portfolio does not hit the
// database on every view. Express also adds an ETag, so revalidation costs a 304.
const CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

// Anything that cannot be a valid slug (including reserved words) cannot be a profile.
function slugOf(req: Request) {
  const slug = slugSchema.safeParse(req.params.slug as string);
  if (!slug.success) throw AppError.notFound('Profile not found');
  return slug.data;
}

export const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await publicService.getPublicProfile(slugOf(req));
  res.set('Cache-Control', CACHE_CONTROL);
  res.json(profile);
});

// The body has been validated by validateBody(); it always lands as pending review.
export const submitTestimonial = asyncHandler(async (req, res) => {
  await testimonialService.submit(slugOf(req), req.body as TestimonialInput);
  res.status(201).json({ received: true });
});

// Which AI service reads uploaded resumes, for the privacy page to name. null when resume import is
// not set up (no API key), so the page does not claim a provider that is not in use.
export const getSiteInfo = asyncHandler(async (_req, res) => {
  const provider = !config.LLM_API_KEY
    ? null
    : config.LLM_PROVIDER === 'gemini'
      ? 'Google (Gemini API)'
      : config.LLM_BASE_URL
        ? 'an OpenAI-compatible AI service'
        : 'OpenAI';
  res.json({ aiProvider: provider });
});
