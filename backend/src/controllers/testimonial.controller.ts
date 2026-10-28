import type { Request } from 'express';
import type {
  ReorderInput,
  TestimonialInput,
  TestimonialSettings,
  TestimonialStatus,
} from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import * as service from '../services/testimonial.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const idOf = (req: Request) => req.params.id as string;

// req.body has already been validated and parsed by validateBody().
export const listTestimonials = asyncHandler(async (req, res) => {
  res.json(await service.list(getProfileId(req)));
});

export const createTestimonial = asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(getProfileId(req), req.body as TestimonialInput));
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  res.json(await service.update(getProfileId(req), idOf(req), req.body as TestimonialInput));
});

// Approve and reject share one handler; the route says which.
const setStatus = (status: TestimonialStatus) =>
  asyncHandler(async (req, res) => {
    res.json(await service.setStatus(getProfileId(req), idOf(req), status));
  });
export const approveTestimonial = setStatus('approved');
export const rejectTestimonial = setStatus('rejected');

export const deleteTestimonial = asyncHandler(async (req, res) => {
  await service.remove(getProfileId(req), idOf(req));
  res.status(204).end();
});

export const reorderTestimonials = asyncHandler(async (req, res) => {
  const { ids } = req.body as ReorderInput;
  res.json(await service.reorder(getProfileId(req), ids));
});

export const updateTestimonialSettings = asyncHandler(async (req, res) => {
  const { acceptTestimonials } = req.body as TestimonialSettings;
  res.json(await service.setAccepting(getProfileId(req), acceptTestimonials));
});
