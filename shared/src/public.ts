import { z } from 'zod';
import { linkTypeSchema, profileSchema } from './portfolio';

// The body of GET /public/:slug. Dates are ISO strings because they have been through JSON.
// The top-level fields come from profileSchema, so a new profile field only needs adding there.

const isoDate = z.string();

export const publicLinkSchema = z.object({
  id: z.string(),
  type: linkTypeSchema,
  url: z.string(),
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

export const publicProfileSchema = profileSchema.omit({ id: true, published: true }).extend({
  links: z.array(publicLinkSchema),
  skills: z.array(publicSkillSchema),
  experience: z.array(publicExperienceSchema),
  projects: z.array(publicProjectSchema),
  education: z.array(publicEducationSchema),
});

export type PublicLink = z.infer<typeof publicLinkSchema>;
export type PublicSkill = z.infer<typeof publicSkillSchema>;
export type PublicExperience = z.infer<typeof publicExperienceSchema>;
export type PublicProject = z.infer<typeof publicProjectSchema>;
export type PublicEducation = z.infer<typeof publicEducationSchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
