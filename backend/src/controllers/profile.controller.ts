import type { ProfileUpdateInput, PublishInput, SectionsUpdateInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { getProfileId } from '../middleware/auth';
import * as avatarService from '../services/avatar.service';
import * as profileService from '../services/profile.service';
import * as resumeService from '../services/resume.service';

// req.body has already been validated and parsed by validateBody().
export const getMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.getProfile(getProfileId(req)));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  res.json(await profileService.updateProfile(getProfileId(req), req.body as ProfileUpdateInput));
});

export const getMySections = asyncHandler(async (req, res) => {
  res.json({ sections: await profileService.getSections(getProfileId(req)) });
});

export const updateMySections = asyncHandler(async (req, res) => {
  const { sections } = req.body as SectionsUpdateInput;
  res.json({ sections: await profileService.updateSections(getProfileId(req), sections) });
});

export const deleteMyAvatar = asyncHandler(async (req, res) => {
  await avatarService.removeAvatar(getProfileId(req));
  res.status(204).end();
});

// req.file is set by the avatarUpload middleware (multipart field "avatar").
export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', 'Attach an image in the "avatar" form field');
  res.json(await avatarService.replaceAvatar(getProfileId(req), req.file.buffer));
});

export const publishMyProfile = asyncHandler(async (req, res) => {
  const { published } = req.body as PublishInput;
  res.json(await profileService.setPublished(getProfileId(req), published));
});

// req.file is set by the resumeUpload middleware (multipart field "resume"). The result is
// returned for the person to review; nothing is saved here.
export const parseMyResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', 'Attach a PDF in the "resume" form field');
  res.json(await resumeService.parseResume(req.file.buffer));
});
