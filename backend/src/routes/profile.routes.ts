import { Router } from 'express';
import {
  customItemInputSchema,
  customSectionInputSchema,
  profileUpdateSchema,
  publishSchema,
  reorderSchema,
  sectionsUpdateSchema,
} from '@portfolio/shared';
import {
  createCustomItem,
  createCustomSection,
  deleteCustomItem,
  deleteCustomSection,
  getCustomItem,
  listCustomItems,
  listCustomSections,
  reorderCustomItems,
  updateCustomItem,
  updateCustomSection,
} from '../controllers/custom-section.controller';
import {
  deleteMyAvatar,
  getMyProfile,
  getMySections,
  parseMyResume,
  publishMyProfile,
  updateMyProfile,
  updateMySections,
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

// Layout of the page: which sections show, in what order, under what heading. Declared before
// /me/:section like the others, so "sections" is not read as a section name.
profileRouter.get('/me/sections', getMySections);
profileRouter.put('/me/sections', validateBody(sectionsUpdateSchema), updateMySections);

// Sections the user made up, and their items. Also declared before /me/:section. The items'
// reorder route comes before /items/:itemId so "reorder" is not read as an item id.
profileRouter.get('/me/custom-sections', listCustomSections);
profileRouter.post(
  '/me/custom-sections',
  validateBody(customSectionInputSchema),
  createCustomSection,
);
profileRouter.put(
  '/me/custom-sections/:id',
  validateBody(customSectionInputSchema),
  updateCustomSection,
);
profileRouter.delete('/me/custom-sections/:id', deleteCustomSection);
profileRouter.get('/me/custom-sections/:id/items', listCustomItems);
profileRouter.post(
  '/me/custom-sections/:id/items',
  validateBody(customItemInputSchema),
  createCustomItem,
);
profileRouter.patch(
  '/me/custom-sections/:id/items/reorder',
  validateBody(reorderSchema),
  reorderCustomItems,
);
profileRouter.get('/me/custom-sections/:id/items/:itemId', getCustomItem);
profileRouter.put(
  '/me/custom-sections/:id/items/:itemId',
  validateBody(customItemInputSchema),
  updateCustomItem,
);
profileRouter.delete('/me/custom-sections/:id/items/:itemId', deleteCustomItem);

// :section is one of experience | education | projects | skills | links
profileRouter.patch('/me/:section/reorder', validateBody(reorderSchema), reorderSection);
profileRouter.get('/me/:section', listSection);
profileRouter.post('/me/:section', validateSectionBody, createSectionItem);
profileRouter.get('/me/:section/:id', getSectionItem);
profileRouter.put('/me/:section/:id', validateSectionBody, updateSectionItem);
profileRouter.delete('/me/:section/:id', deleteSectionItem);
