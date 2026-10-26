import { Router } from 'express';
import { profileUpdateSchema, publishSchema, reorderSchema } from '@portfolio/shared';
import {
  deleteMyAvatar,
  getMyProfile,
  parseMyResume,
  publishMyProfile,
  updateMyProfile,
  uploadMyAvatar,
} from '../controllers/profile.controller';
import {
  createSectionItem,
  deleteSectionItem,
  getSectionItem,
  listSection,
  reorderSection,
  updateSectionItem,
} from '../controllers/section.controller';
import { requireAuth } from '../middleware/auth';
import { resumeLimiter, uploadLimiter } from '../middleware/rate-limit';
import { avatarUpload, resumeUpload } from '../middleware/upload';
import { sectionParam, validateSectionBody } from '../middleware/section';
import { validateBody } from '../middleware/validate';

export const profileRouter = Router();

// Everything here belongs to the signed-in user.
profileRouter.use(requireAuth);
profileRouter.param('section', sectionParam);

profileRouter.get('/me', getMyProfile);
profileRouter.put('/me', validateBody(profileUpdateSchema), updateMyProfile);
// Declared before /me/:section so "publish" and "avatar" are not read as section names.
profileRouter.post('/me/publish', validateBody(publishSchema), publishMyProfile);
// Auth has already run (router-level), so unauthenticated uploads are rejected before any
// bytes are read. Then: rate limit, multipart parse (2 MB, jpg/png/webp), upload.
profileRouter.post('/me/avatar', uploadLimiter, avatarUpload, uploadMyAvatar);
profileRouter.delete('/me/avatar', deleteMyAvatar);
// Reads a resume PDF and returns the parsed data. Declared before /me/:section like the others.
profileRouter.post('/me/resume', resumeLimiter, resumeUpload, parseMyResume);

// :section is one of experience | education | projects | skills | links
profileRouter.patch('/me/:section/reorder', validateBody(reorderSchema), reorderSection);
profileRouter.get('/me/:section', listSection);
profileRouter.post('/me/:section', validateSectionBody, createSectionItem);
profileRouter.get('/me/:section/:id', getSectionItem);
profileRouter.put('/me/:section/:id', validateSectionBody, updateSectionItem);
profileRouter.delete('/me/:section/:id', deleteSectionItem);
