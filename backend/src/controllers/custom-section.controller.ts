import type { Request } from 'express';
import type { CustomItemInput, CustomSectionInput, ReorderInput } from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { getProfileId } from '../middleware/auth';
import * as service from '../services/custom-section.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const sectionId = (req: Request) => req.params.id as string;
const itemId = (req: Request) => req.params.itemId as string;

// req.body has already been validated and parsed by validateBody().
export const listCustomSections = asyncHandler(async (req, res) => {
  res.json(await service.listSections(getProfileId(req)));
});

// Returns the new section and the page layout, which now includes it at the end.
export const createCustomSection = asyncHandler(async (req, res) => {
  const result = await service.createSection(getProfileId(req), req.body as CustomSectionInput);
  res.status(201).json(result);
});

export const updateCustomSection = asyncHandler(async (req, res) => {
  const section = await service.updateSection(
    getProfileId(req),
    sectionId(req),
    req.body as CustomSectionInput,
  );
  res.json(section);
});

// Returns the page layout without the deleted section.
export const deleteCustomSection = asyncHandler(async (req, res) => {
  res.json(await service.deleteSection(getProfileId(req), sectionId(req)));
});

export const listCustomItems = asyncHandler(async (req, res) => {
  res.json(await service.listItems(getProfileId(req), sectionId(req)));
});

export const getCustomItem = asyncHandler(async (req, res) => {
  res.json(await service.getItem(getProfileId(req), sectionId(req), itemId(req)));
});

export const createCustomItem = asyncHandler(async (req, res) => {
  const item = await service.createItem(
    getProfileId(req),
    sectionId(req),
    req.body as CustomItemInput,
  );
  res.status(201).json(item);
});

export const updateCustomItem = asyncHandler(async (req, res) => {
  const item = await service.updateItem(
    getProfileId(req),
    sectionId(req),
    itemId(req),
    req.body as CustomItemInput,
  );
  res.json(item);
});

export const deleteCustomItem = asyncHandler(async (req, res) => {
  await service.deleteItem(getProfileId(req), sectionId(req), itemId(req));
  res.status(204).end();
});

export const reorderCustomItems = asyncHandler(async (req, res) => {
  const { ids } = req.body as ReorderInput;
  res.json(await service.reorderItems(getProfileId(req), sectionId(req), ids));
});
