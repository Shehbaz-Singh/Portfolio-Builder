import {
  customIdOf,
  isCustomKey,
  normalizeSectionConfig,
  type SectionConfig,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

// The page layout: Profile.sectionConfig, which orders and shows or hides every section, the
// built-in ones and the custom ones ("custom:<id>").

// The stored JSON is trusted only after it has been through normalizeSectionConfig with the
// profile's real custom section ids, so the client always gets a complete list that matches
// what exists.
export const withSections = <
  T extends { sectionConfig: unknown; customSections: { id: string }[] },
>(
  profile: T,
) => ({
  ...profile,
  sectionConfig: normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  ),
});

export async function getSections(profileId: string): Promise<SectionConfig> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      sectionConfig: true,
      customSections: { select: { id: true }, orderBy: { order: 'asc' } },
    },
  });
  if (!profile) throw AppError.notFound('Profile not found');
  return withSections(profile).sectionConfig;
}

// Writes the layout and keeps each custom section's `order` and `visible` columns equal to its
// entry in it. `requested` is the new list (from PUT /profile/me/sections); without it the stored
// list is re-checked, which is how creating or deleting a custom section adds or removes its entry.
// Run it inside the same transaction as the change that needs it.
export async function saveSectionConfig(
  tx: Prisma.TransactionClient,
  profileId: string,
  requested?: unknown,
): Promise<SectionConfig> {
  const profile = await tx.profile.findUnique({
    where: { id: profileId },
    select: {
      sectionConfig: true,
      customSections: { select: { id: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] },
    },
  });
  if (!profile) throw AppError.notFound('Profile not found');

  const config = normalizeSectionConfig(
    requested ?? profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  );
  await tx.profile.update({ where: { id: profileId }, data: { sectionConfig: config } });

  for (const [order, { key, visible }] of config.entries()) {
    if (!isCustomKey(key)) continue;
    await tx.customSection.update({
      where: { id: customIdOf(key), profileId },
      data: { order, visible },
    });
  }
  return config;
}

// Stores the complete list: a built-in or custom section left out of the request is added back at
// the end, visible, and an entry for a custom section that is not this profile's is dropped.
export function updateSections(profileId: string, sections: SectionConfig) {
  return prisma.$transaction((tx) => saveSectionConfig(tx, profileId, sections));
}
