import { z } from 'zod';
import { linkTypeSchema } from './portfolio';

// The body of POST /profile/me/resume: what was read from an uploaded resume. Nothing here is
// saved. It is the shape the editor forms start from, so a person can review and fix it first.
// Dates are "YYYY-MM" (what month inputs use); `null` means the resume did not say.

export const parsedResumeSchema = z.object({
  fullName: z.string().nullable(),
  tagline: z.string().nullable(),
  about: z.string().nullable(),
  location: z.string().nullable(),
  links: z.array(z.object({ type: linkTypeSchema, url: z.string() })),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
      description: z.string(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      url: z.string().nullable(),
      description: z.string(),
      techTags: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
    }),
  ),
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export const resumeResponseSchema = z.object({
  resume: parsedResumeSchema,
  // Entries the model produced that were dropped because they were not valid (for example a
  // job with no start date). The page tells the person to check for anything missing.
  skipped: z.number().int().min(0),
});
export type ResumeResponse = z.infer<typeof resumeResponseSchema>;
