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

// Only http(s): z.string().url() also accepts "javascript:..." which is an XSS risk once
// the value is rendered as a link on the public page.
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Must start with http:// or https://');

// Optional: when omitted on create the item is appended; on update it keeps its position.
const orderField = z.number().int().min(0).optional();

// Slugs become public URLs (/[slug]), so they must not collide with app routes.
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'signup',
  'dashboard',
  'settings',
  'about',
  'privacy',
  'terms',
  '_next',
] as const;

export const isReservedSlug = (slug: string) =>
  (RESERVED_SLUGS as readonly string[]).includes(slug);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens')
  .refine((s) => !isReservedSlug(s), 'This slug is reserved');

// The themes a profile may choose. The frontend's theme registry has an entry for each key (its
// type is a Record over this list), so adding a theme means adding the key here and the entry
// there. Only these keys are accepted when saving.
export const THEME_KEYS = ['minimal', 'dark', 'creative', 'classic'] as const;
export const themeSchema = z.enum(THEME_KEYS);
export type ThemeKey = z.infer<typeof themeSchema>;
export const DEFAULT_THEME: ThemeKey = 'minimal';
export const isThemeKey = (value: string): value is ThemeKey =>
  (THEME_KEYS as readonly string[]).includes(value);

export const DEFAULT_ACCENT = '#2563eb';

// Exactly #RRGGBB (no shorthand, no alpha, no names): the value is placed in a CSS variable on
// the public page, so nothing else may get through. Stored lowercase.
export const accentColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'Use a hex color like #2563eb');

export const linkTypeSchema = z.enum(['linkedin', 'github', 'email', 'phone', 'website', 'other']);
export type LinkType = z.infer<typeof linkTypeSchema>;

export const profileInputSchema = z.object({
  slug: slugSchema,
  fullName: trimmed(100),
  tagline: optionalText(160),
  about: optionalText(5000),
  location: optionalText(100),
  avatarUrl: httpUrl.nullish().transform((v) => v ?? null),
  theme: themeSchema.default(DEFAULT_THEME),
  accentColor: accentColorSchema.default(DEFAULT_ACCENT),
  published: z.boolean().default(false),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

// A stored profile: the same fields as the input, plus its id. Deriving it here means adding
// a profile field is a one-place change (the backend's Prisma select reads these keys too).
// `theme` is a plain string when read: the whitelist applies to what is saved, and a stored value
// that is no longer offered must not break the page (the frontend falls back to the default).
export const profileSchema = profileInputSchema.extend({ id: z.string(), theme: z.string() });
export type Profile = z.infer<typeof profileSchema>;

// PUT /profile/me. Publishing has its own endpoint, and omitting the slug keeps the current one.
export const profileUpdateSchema = profileInputSchema
  .omit({ slug: true, published: true })
  .extend({ slug: slugSchema.optional() });
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// POST /profile/me/publish. No value toggles; a value sets it (safe to retry).
export const publishSchema = z.object({ published: z.boolean().optional() });
export type PublishInput = z.infer<typeof publishSchema>;

const PHONE = /^\+?[\d\s().-]{5,25}$/;

export const linkInputSchema = z
  .object({
    type: linkTypeSchema,
    url: trimmed(2048),
    visible: z.boolean().default(true),
    order: orderField,
  })
  .superRefine((link, ctx) => {
    const valid =
      link.type === 'email'
        ? z.string().email().safeParse(link.url).success
        : link.type === 'phone'
          ? PHONE.test(link.url)
          : httpUrl.safeParse(link.url).success;
    if (!valid) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message:
          link.type === 'email'
            ? 'Must be a valid email address'
            : link.type === 'phone'
              ? 'Must be a valid phone number'
              : 'Must be a valid http(s) URL',
      });
    }
  });
export type LinkInput = z.infer<typeof linkInputSchema>;

export const skillInputSchema = z.object({
  name: trimmed(60),
  order: orderField,
});
export type SkillInput = z.infer<typeof skillInputSchema>;

const dateRange = <T extends { startDate: Date; endDate: Date | null }>(v: T) =>
  v.endDate === null || v.endDate >= v.startDate;
const dateRangeIssue = { message: 'End date must not be before the start date', path: ['endDate'] };

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
  url: httpUrl.nullish().transform((v) => v ?? null),
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

// ---- Sections: the five lists under a profile, managed through one generic API ----

export const SECTIONS = ['experience', 'education', 'projects', 'skills', 'links'] as const;
export type Section = (typeof SECTIONS)[number];
export const isSection = (value: string): value is Section =>
  (SECTIONS as readonly string[]).includes(value);

export const sectionInputSchemas = {
  experience: experienceInputSchema,
  education: educationInputSchema,
  projects: projectInputSchema,
  skills: skillInputSchema,
  links: linkInputSchema,
} satisfies Record<Section, z.ZodTypeAny>;

// Keeps one account from filling the database.
export const SECTION_LIMITS: Record<Section, number> = {
  experience: 30,
  education: 20,
  projects: 30,
  skills: 60,
  links: 20,
};

// PATCH /profile/me/:section/reorder
export const reorderSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, 'ids must be unique'),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

// A whole portfolio in one payload (used by the seed script and later by resume auto-fill).
export const fullProfileInputSchema = profileInputSchema.extend({
  links: z.array(linkInputSchema).default([]),
  skills: z.array(skillInputSchema).default([]),
  experience: z.array(experienceInputSchema).default([]),
  projects: z.array(projectInputSchema).default([]),
  education: z.array(educationInputSchema).default([]),
});
export type FullProfileInput = z.infer<typeof fullProfileInputSchema>;
