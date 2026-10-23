import type { Request } from 'express';
import type { ReorderInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import { sectionOf } from '../middleware/section';
import * as sectionService from '../services/section.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const itemId = (req: Request) => req.params.id as string;

// The section name comes from the URL (validated by sectionParam) and req.body from
// validateSectionBody, so the handlers below are the same for all five sections.
export const listSection = asyncHandler(async (req, res) => {
  res.json(await sectionService.listItems(sectionOf(res), getProfileId(req)));
});

export const getSectionItem = asyncHandler(async (req, res) => {
  res.json(await sectionService.getItem(sectionOf(res), getProfileId(req), itemId(req)));
});

export const createSectionItem = asyncHandler(async (req, res) => {
  const item = await sectionService.createItem(sectionOf(res), getProfileId(req), req.body);
  res.status(201).json(item);
});

export const updateSectionItem = asyncHandler(async (req, res) => {
  const item = await sectionService.updateItem(
    sectionOf(res),
    getProfileId(req),
    itemId(req),
    req.body,
  );
  res.json(item);
});

export const deleteSectionItem = asyncHandler(async (req, res) => {
  await sectionService.deleteItem(sectionOf(res), getProfileId(req), itemId(req));
  res.status(204).end();
});

export const reorderSection = asyncHandler(async (req, res) => {
  const { ids } = req.body as ReorderInput;
  res.json(await sectionService.reorderItems(sectionOf(res), getProfileId(req), ids));
});
