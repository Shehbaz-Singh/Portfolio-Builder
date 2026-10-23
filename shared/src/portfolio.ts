import { z } from 'zod';

// Request-body schemas for the portfolio models. Dates are accepted as ISO strings
// (e.g. "2024-06-01") and coerced to Date objects.

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const urlString = z.string().trim().url().max(2048);
const orderField = z.number().int().min(0).default(0);

// Slugs become public URLs (/[slug]), so they must not collide with app routes.
export const RESERVED_SLUGS = [
  'api',
  'login',
  'signup',
  'register',
  'dashboard',
  'settings',
  'admin',
  'health',
  '_next',
] as const;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens')
  .refine((s) => !(RESERVED_SLUGS as readonly string[]).includes(s), 'This slug is reserved');

export const themeSchema = z.string().trim().min(1).max(50);

export const linkTypeSchema = z.enum(['linkedin', 'github', 'email', 'phone', 'website', 'other']);
export type LinkType = z.infer<typeof linkTypeSchema>;

export const profileInputSchema = z.object({
  slug: slugSchema,
  fullName: trimmed(100),
  tagline: optionalText(160),
  about: optionalText(5000),
  location: optionalText(100),
  avatarUrl: urlString.nullish().transform((v) => v ?? null),
  theme: themeSchema.default('minimal'),
  published: z.boolean().default(false),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

// A stored profile: the same fields as the input, plus its id. Deriving it here means adding
// a profile field is a one-place change (the backend's Prisma select reads these keys too).
export const profileSchema = profileInputSchema.extend({ id: z.string() });
export type Profile = z.infer<typeof profileSchema>;

export const linkInputSchema = z.object({
  type: linkTypeSchema,
  // email/phone links are not URLs, so only require a non-empty value here.
  url: trimmed(2048),
  visible: z.boolean().default(true),
});
export type LinkInput = z.infer<typeof linkInputSchema>;

export const skillInputSchema = z.object({
  name: trimmed(60),
  order: orderField,
});
export type SkillInput = z.infer<typeof skillInputSchema>;

const dateRange = <T extends { startDate: Date; endDate: Date | null }>(v: T) =>
  v.endDate === null || v.endDate >= v.startDate;
const dateRangeIssue = { message: 'endDate must not be before startDate', path: ['endDate'] };

export const experienceInputSchema = z
  .object({
    title: trimmed(100),
    company: trimmed(100),
    startDate: z.coerce.date(),
    endDate: z.coerce
      .date()
      .nullish()
      .transform((v) => v ?? null),
    description: z.string().trim().max(3000).default(''),
    order: orderField,
  })
  .refine(dateRange, dateRangeIssue);
export type ExperienceInput = z.infer<typeof experienceInputSchema>;

export const projectInputSchema = z.object({
  name: trimmed(100),
  url: urlString.nullish().transform((v) => v ?? null),
  description: z.string().trim().max(3000).default(''),
  techTags: z.array(trimmed(30)).max(20).default([]),
  order: orderField,
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const educationInputSchema = z
  .object({
    degree: trimmed(150),
    institution: trimmed(150),
    startDate: z.coerce.date(),
    endDate: z.coerce
      .date()
      .nullish()
      .transform((v) => v ?? null),
    order: orderField,
  })
  .refine(dateRange, dateRangeIssue);
export type EducationInput = z.infer<typeof educationInputSchema>;

// A whole portfolio in one payload (used by the seed script and later by resume auto-fill).
export const fullProfileInputSchema = profileInputSchema.extend({
  links: z.array(linkInputSchema).default([]),
  skills: z.array(skillInputSchema).default([]),
  experience: z.array(experienceInputSchema).default([]),
  projects: z.array(projectInputSchema).default([]),
  education: z.array(educationInputSchema).default([]),
});
export type FullProfileInput = z.infer<typeof fullProfileInputSchema>;
