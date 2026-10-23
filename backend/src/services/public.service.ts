import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { orderedList, publicProfileSelect } from '../lib/selects';

// Built from an explicit select, so nothing outside this list can reach a visitor. In
// particular the User row is never touched: no account email, passwordHash or userId.
const publicSelect = {
  ...publicProfileSelect,
  // Hidden links are filtered in the database. `visible` is dropped since it is always true.
  links: {
    where: { visible: true },
    omit: { profileId: true, visible: true },
    orderBy: { id: 'asc' },
  },
  skills: orderedList,
  experience: orderedList,
  projects: orderedList,
  education: orderedList,
} satisfies Prisma.ProfileSelect;

// An unpublished profile and a profile that does not exist both give the same 404, so
// nobody can tell which slugs are taken by profiles that are not public.
export async function getPublicProfile(slug: string) {
  const profile = await prisma.profile.findFirst({
    where: { slug, published: true },
    select: publicSelect,
  });
  if (!profile) throw AppError.notFound('Profile not found');
  return profile;
}
