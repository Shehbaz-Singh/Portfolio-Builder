import type { Request } from 'express';
import { isLocaleCode, type TranslationsSave } from '@parichay/shared';
import { asyncHandler } from '../lib/async-handler';
import { AppError } from '../lib/errors';
import { getProfileId } from '../middleware/auth';
import * as ai from '../services/translation-ai.service';
import * as service from '../services/translation.service';
import { ERRORS } from '../lib/messages';

// A language code from the path. An unknown one is the same 404 as a language that is not added.
function localeOf(req: Request) {
  const locale = req.params.locale as string;
  if (!isLocaleCode(locale)) throw AppError.notFound(ERRORS.languageNotFound);
  return locale;
}

export const getLanguages = asyncHandler(async (req, res) => {
  res.json(await service.getLanguages(getProfileId(req)));
});

export const addLanguage = asyncHandler(async (req, res) => {
  const { locale } = req.body as { locale: string };
  res.status(201).json(await service.addLanguage(getProfileId(req), locale));
});

export const setDefaultLanguage = asyncHandler(async (req, res) => {
  const { defaultLocale } = req.body as { defaultLocale: string };
  res.json(await service.setDefaultLanguage(getProfileId(req), defaultLocale));
});

// Removing deletes that language's texts for good, so the code must be repeated as a confirmation:
// DELETE /profile/me/languages/hi?confirm=hi
export const removeLanguage = asyncHandler(async (req, res) => {
  const locale = localeOf(req);
  if (req.query.confirm !== locale) {
    throw new AppError(400, 'CONFIRMATION_REQUIRED', ERRORS.confirmRepeatCode);
  }
  res.json(await service.removeLanguage(getProfileId(req), locale));
});

export const getTranslations = asyncHandler(async (req, res) => {
  const profileId = getProfileId(req);
  const locale = localeOf(req);
  res.json({ locale, entries: await service.listTranslations(profileId, locale) });
});

export const saveTranslations = asyncHandler(async (req, res) => {
  const profileId = getProfileId(req);
  const locale = localeOf(req);
  const { entries } = req.body as TranslationsSave;
  res.json({ locale, entries: await service.saveTranslations(profileId, locale, entries) });
});

export const suggestTranslation = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw AppError.unauthorized();
  res.json(
    await ai.suggest(user.id, getProfileId(req), req.body as Parameters<typeof ai.suggest>[2]),
  );
});
