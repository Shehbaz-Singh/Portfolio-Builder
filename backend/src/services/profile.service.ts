import type { ProfileUpdateInput } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { isUniqueViolation } from '../lib/prisma-errors';
import {
  customItems,
  myPostSummaries,
  myTestimonials,
  orderedList,
  profileSelect,
} from '../lib/selects';
import { withSections } from './section-layout.service';
import { assertSlugAvailable, slugTaken } from './slug.service';

// The whole profile as the editor (and later the public page) needs it, in one query.
const fullProfileSelect = {
  ...profileSelect,
  sectionConfig: true,
  links: orderedList,
  skills: orderedList,
  experience: orderedList,
  projects: orderedList,
  education: orderedList,
  customSections: {
    select: { id: true, title: true, visible: true, order: true, items: customItems },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
  testimonials: myTestimonials,
  posts: myPostSummaries,
} satisfies Prisma.ProfileSelect;

export async function getProfile(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: fullProfileSelect,
  });
  if (!profile) throw AppError.notFound('Profile not found');
  return withSections(profile);
}

export async function updateProfile(profileId: string, input: ProfileUpdateInput) {
  const { slug, ...fields } = input;
  if (slug) await assertSlugAvailable(slug, profileId);

  try {
    return withSections(
      await prisma.profile.update({
        where: { id: profileId },
        data: { ...fields, ...(slug && { slug }) },
        select: fullProfileSelect,
      }),
    );
  } catch (err) {
    // Someone else claimed the slug between the check and the update.
    if (isUniqueViolation(err)) throw slugTaken();
    throw err;
  }
}

// With no value the flag is toggled; with a value it is set, so retries are safe.
export async function setPublished(profileId: string, published?: boolean) {
  let next = published;
  if (next === undefined) {
    const current = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { published: true },
    });
    if (!current) throw AppError.notFound('Profile not found');
    next = !current.published;
  }

  return prisma.profile.update({
    where: { id: profileId },
    data: { published: next },
    select: { published: true },
  });
}
