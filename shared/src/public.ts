import { z } from 'zod';
import { linkTypeSchema, profileSchema } from './portfolio';
import {
  SECTION_KEYS,
  defaultSectionConfig,
  publicSectionSchema,
  sectionConfigSchema,
} from './section-config';

// The body of GET /public/:slug. Dates are ISO strings because they have been through JSON.
// The top-level fields come from profileSchema, so a new profile field only needs adding there.

const isoDate = z.string();

export const publicLinkSchema = z.object({
  id: z.string(),
  type: linkTypeSchema,
  url: z.string(),
  order: z.number(),
});

export const publicSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
});

export const publicExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  description: z.string(),
  order: z.number(),
});

export const publicProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
  description: z.string(),
  techTags: z.array(z.string()),
  order: z.number(),
});

export const publicEducationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  institution: z.string(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  order: z.number(),
});

// The four ordered lists are identical in both views.
const sectionLists = {
  skills: z.array(publicSkillSchema),
  experience: z.array(publicExperienceSchema),
  projects: z.array(publicProjectSchema),
  education: z.array(publicEducationSchema),
};

// `sections` is the visible sections in page order. It defaults to everything so a page keeps
// working against an API that predates it. The content of a hidden section is left out by the API.
export const publicProfileSchema = profileSchema.omit({ id: true, published: true }).extend({
  sections: z.array(publicSectionSchema).default(() => SECTION_KEYS.map((key) => ({ key }))),
  links: z.array(publicLinkSchema),
  ...sectionLists,
});

// The body of GET /profile/me: what the editor needs. Unlike the public view it keeps the
// profile id and published flag, and hidden links (with their visible flag).
export const myProfileSchema = profileSchema.extend({
  // All sections, hidden ones included, in page order (GET/PUT /profile/me/sections).
  sectionConfig: sectionConfigSchema.default(defaultSectionConfig),
  links: z.array(publicLinkSchema.extend({ visible: z.boolean() })),
  ...sectionLists,
});

export type PublicLink = z.infer<typeof publicLinkSchema>;
export type PublicSkill = z.infer<typeof publicSkillSchema>;
export type PublicExperience = z.infer<typeof publicExperienceSchema>;
export type PublicProject = z.infer<typeof publicProjectSchema>;
export type PublicEducation = z.infer<typeof publicEducationSchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type MyProfile = z.infer<typeof myProfileSchema>;
export type MyLink = MyProfile['links'][number];
