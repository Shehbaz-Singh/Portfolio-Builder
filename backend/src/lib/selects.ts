import { profileSchema } from '@portfolio/shared';
import type { Prisma } from '../generated/prisma/client';

// The profile columns come from the shared schema's keys, so there is one field list.
export const profileSelect = Object.fromEntries(
  Object.keys(profileSchema.shape).map((key) => [key, true]),
) as { [K in keyof typeof profileSchema.shape]: true } satisfies Prisma.ProfileSelect;

// What a visitor may see: the same fields minus the internal id and the published flag.
const publicProfileShape = profileSchema.omit({ id: true, published: true }).shape;
export const publicProfileSelect = Object.fromEntries(
  Object.keys(publicProfileShape).map((key) => [key, true]),
) as { [K in keyof typeof publicProfileShape]: true } satisfies Prisma.ProfileSelect;

// The items of a custom section in display order (the section id is already known).
export const customItems = {
  omit: { sectionId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.CustomSectionItemFindManyArgs;

// A section list in display order. profileId is dropped: the client already knows the profile.
export const orderedList = {
  omit: { profileId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.SkillFindManyArgs;
