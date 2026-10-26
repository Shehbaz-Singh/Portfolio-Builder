import { z } from 'zod';
import { httpUrl } from './portfolio';
import { optionalBlock, optionalLine, requiredLine } from './text';

// Sections the user creates (Certifications, Awards, Publications, Volunteering, ...): a title
// and a list of items. Where they sit on the page is part of the section config
// (section-config.ts), under the key "custom:<id>".

export const MAX_CUSTOM_SECTIONS = 5;
export const MAX_CUSTOM_ITEMS = 20; // per section
export const CUSTOM_TITLE_MAX = 80;
export const CUSTOM_SUBTITLE_MAX = 120;
export const CUSTOM_DESCRIPTION_MAX = 1000;

const optionalDate = z.coerce
  .date()
  .nullish()
  .transform((date) => date ?? null);

// POST and PUT /profile/me/custom-sections
export const customSectionInputSchema = z.object({ title: requiredLine(CUSTOM_TITLE_MAX) });
export type CustomSectionInput = z.infer<typeof customSectionInputSchema>;

// POST and PUT /profile/me/custom-sections/:id/items. Only the title is required. Dates are
// optional (a single date is fine); an end date needs a start date and must not come before it.
export const customItemInputSchema = z
  .object({
    title: requiredLine(CUSTOM_TITLE_MAX),
    subtitle: optionalLine(CUSTOM_SUBTITLE_MAX),
    startDate: optionalDate,
    endDate: optionalDate,
    url: httpUrl.nullish().transform((url) => url ?? null),
    description: optionalBlock(CUSTOM_DESCRIPTION_MAX),
  })
  .superRefine((item, ctx) => {
    if (item.endDate && !item.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Add a start date before an end date',
      });
    } else if (item.endDate && item.startDate && item.endDate < item.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must not be before the start date',
      });
    }
  });
export type CustomItemInput = z.infer<typeof customItemInputSchema>;
