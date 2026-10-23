import type { LoginInput, RegisterInput } from '@portfolio/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import * as authService from '../services/auth.service';

// req.body has already been validated and parsed by validateBody().
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body as LoginInput);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw AppError.unauthorized();
  res.json(await authService.getSession(req.user.id));
});
