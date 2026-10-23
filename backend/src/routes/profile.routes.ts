import { Router } from 'express';
import { profileUpdateSchema, publishSchema, reorderSchema } from '@portfolio/shared';
import { getMyProfile, publishMyProfile, updateMyProfile } from '../controllers/profile.controller';
import {
  createSectionItem,
  deleteSectionItem,
  getSectionItem,
  listSection,
  reorderSection,
  updateSectionItem,
} from '../controllers/section.controller';
import { requireAuth } from '../middleware/auth';
import { sectionParam, validateSectionBody } from '../middleware/section';
import { validateBody } from '../middleware/validate';

export const profileRouter = Router();

// Everything here belongs to the signed-in user.
profileRouter.use(requireAuth);
profileRouter.param('section', sectionParam);

profileRouter.get('/me', getMyProfile);
profileRouter.put('/me', validateBody(profileUpdateSchema), updateMyProfile);
// Declared before /me/:section so "publish" is not read as a section name.
profileRouter.post('/me/publish', validateBody(publishSchema), publishMyProfile);

// :section is one of experience | education | projects | skills | links
profileRouter.patch('/me/:section/reorder', validateBody(reorderSchema), reorderSection);
profileRouter.get('/me/:section', listSection);
profileRouter.post('/me/:section', validateSectionBody, createSectionItem);
profileRouter.get('/me/:section/:id', getSectionItem);
profileRouter.put('/me/:section/:id', validateSectionBody, updateSectionItem);
profileRouter.delete('/me/:section/:id', deleteSectionItem);
