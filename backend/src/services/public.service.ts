import { normalizeSectionConfig, publicLayout } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  customItems,
  orderedList,
  publicPostSummarySelect,
  publicProfileSelect,
  publicTestimonials,
} from '../lib/selects';

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
  testimonials: publicTestimonials,
  // The three latest published posts for the section preview. Drafts are filtered in the database,
  // so they cannot reach this response.
  posts: {
    where: { status: 'published' },
    select: publicPostSummarySelect,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: 4, // one more than shown, to know whether there is more
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
  const { sectionConfig, customSections: own, posts, ...rest } = profile;
  const layout = normalizeSectionConfig(
    sectionConfig,
    own.map((section) => section.id),
  );
  const { sections, customSections } = publicLayout(layout, own);
  const has = (key: string) => sections.some((section) => section.key === key);
  // The badge is only part of the page while it is switched on.
  const { availabilityEnabled, availabilityStatus, availabilityMessage, ...visible } = rest;
  return {
    ...visible,
    ...(availabilityEnabled && { availabilityEnabled, availabilityStatus, availabilityMessage }),
    about: has('about') ? rest.about : null,
    skills: has('skills') ? rest.skills : [],
    experience: has('experience') ? rest.experience : [],
    projects: has('projects') ? rest.projects : [],
    education: has('education') ? rest.education : [],
    testimonials: has('testimonials') ? rest.testimonials : [],
    // Hidden means hidden: no posts either, however many are published.
    writing: has('writing') ? posts.slice(0, 3) : [],
    writingMore: has('writing') && posts.length > 3,
    sections,
    customSections,
  };
}

// ---- the Writing pages: the full list, and one post

// The profile id of a published profile whose Writing section is switched on. Anything else (no such
// profile, unpublished, or the section hidden) is the same 404, so nothing is revealed.
async function writingProfileId(slug: string) {
  const profile = await prisma.profile.findFirst({
    where: { slug, published: true },
    select: { id: true, sectionConfig: true, customSections: { select: { id: true } } },
  });
  if (!profile) throw AppError.notFound('Profile not found');
  const layout = normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  );
  if (!layout.some((item) => item.key === 'writing' && item.visible)) {
    throw AppError.notFound('Profile not found');
  }
  return profile.id;
}

// Published posts only, newest first. The body is left out: the list shows excerpts.
export async function getPublicPosts(slug: string) {
  const profileId = await writingProfileId(slug);
  return prisma.post.findMany({
    where: { profileId, status: 'published' },
    select: publicPostSummarySelect,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
  });
}

export async function getPublicPost(slug: string, postSlug: string) {
  const profileId = await writingProfileId(slug);
  const post = await prisma.post.findFirst({
    where: { profileId, slug: postSlug, status: 'published' },
    select: { ...publicPostSummarySelect, body: true, updatedAt: true },
  });
  if (!post) throw AppError.notFound('Post not found');
  return post;
}

// Every published post that has a page of its own (not links to articles elsewhere), for the sitemap.
// Only profiles that are published and have the Writing section switched on. Capped, newest first.
const SITEMAP_LIMIT = 5000;

export async function getPostsForSitemap() {
  const rows = await prisma.post.findMany({
    where: { status: 'published', type: 'post', profile: { published: true } },
    select: {
      slug: true,
      updatedAt: true,
      profile: {
        select: { slug: true, sectionConfig: true, customSections: { select: { id: true } } },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: SITEMAP_LIMIT,
  });
  return rows
    .filter(({ profile }) =>
      normalizeSectionConfig(
        profile.sectionConfig,
        profile.customSections.map((section) => section.id),
      ).some((item) => item.key === 'writing' && item.visible),
    )
    .map((row) => ({ username: row.profile.slug, postSlug: row.slug, updatedAt: row.updatedAt }));
}
