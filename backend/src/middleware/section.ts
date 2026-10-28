import type { RequestHandler, RequestParamHandler } from 'express';
import { isSection, sectionInputSchemas, type Section } from '@parichay/shared';
import { AppError } from '../lib/errors';
import { validateBody } from './validate';

// router.param('section', sectionParam): rejects unknown sections and stores the valid one.
export const sectionParam: RequestParamHandler = (_req, res, next, value: string) => {
  if (!isSection(value)) return next(AppError.notFound('Unknown section'));
  res.locals.section = value;
  next();
};

export const sectionOf = (res: { locals: Record<string, unknown> }) =>
  res.locals.section as Section;

// Validates the body against the schema for whichever section the URL names.
export const validateSectionBody: RequestHandler = (req, res, next) =>
  validateBody(sectionInputSchemas[sectionOf(res)])(req, res, next);
