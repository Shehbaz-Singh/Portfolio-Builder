import {
  SECTION_LABELS,
  customIdOf,
  isCustomKey,
  type PublicLink,
  type PublicProfile,
  type SectionKey,
} from '@portfolio/shared';
import { SITE_URL } from '@/lib/config';
import { initials, linkTarget, safeHttpUrl } from '@/lib/format';

// Everything a theme needs from a profile, worked out in one place. A theme never looks at the
// raw section list, the custom sections, empty content or URL safety: it draws the header and
// the blocks it is given, with its own layout and styling. So the rules (order, hidden sections,
// custom sections, empty sections skipped, only http(s) links) are the same in every theme.

// One entry of a dated list: a job, a degree, or an item of a custom section.
export interface Entry {
  id: string;
  title: string;
  subtitle: string | null;
  start: string | null; // ISO date
  end: string | null;
  href: string | null; // checked to be http(s)
  description: string | null;
}

interface ProjectEntry {
  id: string;
  name: string;
  href: string | null;
  description: string;
  tags: string[];
}

interface TestimonialEntry {
  id: string;
  name: string;
  detail: string | null; // "Engineering Manager, Acme": whichever of role and company there is
  message: string;
}

interface BlockBase {
  id: string; // unique on the page, for aria-labelledby and anchors
  title: string; // the owner's heading, or the default one
}

export type Block =
  | (BlockBase & { kind: 'about'; text: string })
  | (BlockBase & { kind: 'skills'; skills: { id: string; name: string }[] })
  | (BlockBase & { kind: 'projects'; projects: ProjectEntry[] })
  | (BlockBase & {
      kind: 'testimonials';
      testimonials: TestimonialEntry[];
      // Set when visitors may leave one: the slug the form posts to.
      submitTo: string | null;
    })
  | (BlockBase & {
      kind: 'entries';
      // experience and education show "Present" for an open end date; custom items show nothing
      variant: 'experience' | 'education' | 'custom';
      entries: Entry[];
    });

const isBuiltIn = (key: string): key is SectionKey => Object.hasOwn(SECTION_LABELS, key);

// The sections to draw, in the configured order. Hidden sections are not in profile.sections, and
// a section with no content is left out here even when it is switched on. A key this code does not
// know (a section added later) is skipped, so an older page never breaks.
// `idPrefix` keeps ids unique when a page draws the same profile more than once (the editor's
// theme picker shows each theme in a small card next to the live preview).
export function buildBlocks(profile: PublicProfile, idPrefix = ''): Block[] {
  const blocks: Block[] = [];

  for (const { key, title } of profile.sections) {
    if (isCustomKey(key)) {
      const section = profile.customSections.find((s) => s.id === customIdOf(key));
      if (!section || section.items.length === 0) continue;
      blocks.push({
        kind: 'entries',
        variant: 'custom',
        id: `${idPrefix}custom-${section.id}`,
        title: section.title,
        entries: section.items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          start: item.startDate,
          end: item.endDate,
          href: safeHttpUrl(item.url),
          description: item.description,
        })),
      });
      continue;
    }
    if (!isBuiltIn(key)) continue;

    const base = { id: idPrefix + key, title: title ?? SECTION_LABELS[key] };
    switch (key) {
      case 'about':
        if (profile.about) blocks.push({ kind: 'about', ...base, text: profile.about });
        break;
      case 'skills':
        if (profile.skills.length > 0) {
          blocks.push({
            kind: 'skills',
            ...base,
            skills: profile.skills.map(({ id, name }) => ({ id, name })),
          });
        }
        break;
      case 'experience':
        if (profile.experience.length > 0) {
          blocks.push({
            kind: 'entries',
            variant: 'experience',
            ...base,
            entries: profile.experience.map((job) => ({
              id: job.id,
              title: job.title,
              subtitle: job.company,
              start: job.startDate,
              end: job.endDate,
              href: null,
              description: job.description || null,
            })),
          });
        }
        break;
      case 'projects':
        if (profile.projects.length > 0) {
          blocks.push({
            kind: 'projects',
            ...base,
            projects: profile.projects.map((project) => ({
              id: project.id,
              name: project.name,
              href: safeHttpUrl(project.url),
              description: project.description,
              tags: project.techTags,
            })),
          });
        }
        break;
      case 'testimonials':
        // Shown when there is something to read, or when it invites visitors to write one.
        if (profile.testimonials.length > 0 || profile.acceptTestimonials) {
          blocks.push({
            kind: 'testimonials',
            ...base,
            testimonials: profile.testimonials.map((item) => ({
              id: item.id,
              name: item.authorName,
              detail: [item.authorRole, item.authorCompany].filter(Boolean).join(', ') || null,
              message: item.message,
            })),
            submitTo: profile.acceptTestimonials ? profile.slug : null,
          });
        }
        break;
      case 'education':
        if (profile.education.length > 0) {
          blocks.push({
            kind: 'entries',
            variant: 'education',
            ...base,
            entries: profile.education.map((item) => ({
              id: item.id,
              title: item.degree,
              subtitle: item.institution,
              start: item.startDate,
              end: item.endDate,
              href: null,
              description: null,
            })),
          });
        }
        break;
    }
  }
  return blocks;
}

export interface HeaderModel {
  name: string;
  tagline: string | null;
  location: string | null;
  avatar: { src: string | null; alt: string; initials: string };
  links: { id: string; type: PublicLink['type']; href: string; label: string; external: boolean }[];
  share: { url: string; title: string };
}

// The top of the page. Links that cannot be shown (an unsafe address) are dropped here.
export function buildHeader(profile: PublicProfile): HeaderModel {
  return {
    name: profile.fullName,
    tagline: profile.tagline,
    location: profile.location,
    avatar: {
      src: safeHttpUrl(profile.avatarUrl),
      alt: `Photo of ${profile.fullName}`,
      initials: initials(profile.fullName),
    },
    links: profile.links.flatMap((link) => {
      const target = linkTarget(link);
      return target ? [{ id: link.id, type: link.type, ...target }] : [];
    }),
    share: { url: `${SITE_URL}/${profile.slug}`, title: `${profile.fullName}'s portfolio` },
  };
}

// The bottom of the page: the owner's name and a line about where the page came from.
export interface FooterModel {
  name: string;
  year: number;
  message: string;
  cta: { href: string; label: string };
}

export function buildFooter(profile: PublicProfile): FooterModel {
  return {
    name: profile.fullName,
    year: new Date().getFullYear(),
    message: 'by a developer, for all developers.',
    cta: { href: '/', label: 'Make your own portfolio' },
  };
}
