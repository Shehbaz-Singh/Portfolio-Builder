import { isReservedSlug, ERROR_CODES } from '@parichay/shared';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { slugify } from '../lib/slug';
import { ERRORS } from '../lib/messages';

export const slugTaken = () => AppError.conflict(ERROR_CODES.SLUG_TAKEN, ERRORS.slugTaken);

// "asha-rao", then "asha-rao-2", "asha-rao-3", ... Reserved words count as taken.
// One query loads every slug starting with the base, then the first free number is picked.
export async function generateUniqueSlug(fullName: string): Promise<string> {
  const base = slugify(fullName);
  const rows = await prisma.profile.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set(rows.map((r) => r.slug));

  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!taken.has(candidate) && !isReservedSlug(candidate)) return candidate;
  }
}

// For a slug the user chose themselves: it may already belong to them, but not to anyone else.
export async function assertSlugAvailable(slug: string, profileId: string): Promise<void> {
  const owner = await prisma.profile.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== profileId) throw slugTaken();
}
