import type { Request } from 'express';
import type { PostInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { getProfileId } from '../middleware/auth';
import * as service from '../services/post.service';

// @types/express types route params as string | string[], but Express 4 always gives a string.
const postId = (req: Request) => req.params.id as string;

// req.body has already been validated and parsed by validateBody().
export const listPosts = asyncHandler(async (req, res) => {
  res.json(await service.listPosts(getProfileId(req)));
});

export const getPost = asyncHandler(async (req, res) => {
  res.json(await service.getPost(getProfileId(req), postId(req)));
});

export const createPost = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createPost(getProfileId(req), req.body as PostInput));
});

export const updatePost = asyncHandler(async (req, res) => {
  res.json(await service.updatePost(getProfileId(req), postId(req), req.body as PostInput));
});

export const deletePost = asyncHandler(async (req, res) => {
  await service.deletePost(getProfileId(req), postId(req));
  res.status(204).end();
});

// req.file is set by the coverUpload middleware (multipart field "cover").
export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'NO_FILE', 'Attach an image in the "cover" form field');
  res.json(await service.replaceCover(getProfileId(req), postId(req), req.file.buffer));
});

export const deleteCover = asyncHandler(async (req, res) => {
  await service.removeCover(getProfileId(req), postId(req));
  res.status(204).end();
});
