import { profileSchema } from '@portfolio/shared';
import type { Prisma } from '../generated/prisma/client';

// The profile columns come from the shared schema's keys, so there is one field list.
export const profileSelect = Object.fromEntries(
  Object.keys(profileSchema.shape).map((key) => [key, true]),
) as { [K in keyof typeof profileSchema.shape]: true } satisfies Prisma.ProfileSelect;

// A section list in display order. profileId is dropped: the client already knows the profile.
export const orderedList = {
  omit: { profileId: true },
  orderBy: [{ order: 'asc' }, { id: 'asc' }],
} satisfies Prisma.SkillFindManyArgs;
