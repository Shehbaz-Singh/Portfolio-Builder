import type {
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
} from '@portfolio/shared';
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

export const changePassword = asyncHandler(async (req, res) => {
  if (!req.user) throw AppError.unauthorized();
  await authService.changePassword(req.user.id, req.body as ChangePasswordInput);
  res.status(204).end();
});

export const deleteAccount = asyncHandler(async (req, res) => {
  if (!req.user) throw AppError.unauthorized();
  await authService.deleteAccount(req.user.id, req.body as DeleteAccountInput);
  res.status(204).end();
});
