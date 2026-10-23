import type { ProfileUpdateInput, PublishInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import * as profileService from '../services/profile.service';

// req.body has already been validated and parsed by validateBody().
export const getMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.getProfile(getProfileId(req)));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.updateProfile(getProfileId(req), req.body as ProfileUpdateInput));
});

export const publishMyProfile = asyncHandler(async (req, res) => {
  const { published } = req.body as PublishInput;
  res.json(await profileService.setPublished(getProfileId(req), published));
});
