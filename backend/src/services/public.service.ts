import { normalizeSectionConfig, publicLayout } from '@portfolio/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { customItems, orderedList, publicProfileSelect } from '../lib/selects';

// Built from an explicit select, so nothing outside this list can reach a visitor. In
// particular the User row is never touched: no account email, passwordHash or userId.
const publicSelect = {
  ...publicProfileSelect,
  sectionConfig: true,
  // Hidden links are filtered in the database. `visible` is dropped since it is always true.
  links: {
    where: { visible: true },
    omit: { profileId: true, visible: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
  skills: orderedList,
  experience: orderedList,
  projects: orderedList,
  education: orderedList,
  // Whether one is shown is decided by the layout (sectionConfig), not by these rows.
  customSections: {
    select: { id: true, title: true, items: customItems },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.ProfileSelect;

// An unpublished profile and a profile that does not exist both give the same 404, so
// nobody can tell which slugs are taken by profiles that are not public.
export async function getPublicProfile(slug: string) {
  const profile = await prisma.profile.findFirst({
    where: { slug, published: true },
    select: publicSelect,
  });
  if (!profile) throw AppError.notFound('Profile not found');

  // `sections` lists what is shown, in order. The content of a hidden section is left out too:
  // hiding is about privacy as much as layout, and the JSON is as public as the page. Custom
  // sections come back in layout order, visible ones that have items only.
  const { sectionConfig, customSections: own, ...rest } = profile;
  const layout = normalizeSectionConfig(
    sectionConfig,
    own.map((section) => section.id),
  );
  const { sections, customSections } = publicLayout(layout, own);
  const has = (key: string) => sections.some((section) => section.key === key);
  return {
    ...rest,
    about: has('about') ? rest.about : null,
    skills: has('skills') ? rest.skills : [],
    experience: has('experience') ? rest.experience : [],
    projects: has('projects') ? rest.projects : [],
    education: has('education') ? rest.education : [],
    sections,
    customSections,
  };
}
