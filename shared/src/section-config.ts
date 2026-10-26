import { z } from 'zod';

// Which sections the portfolio page shows, in what order, and under what heading. This is
// layout only: the content itself (skills, jobs, ...) is stored as before.
//
// To add a kind of section later (custom sections, testimonials): append its key to SECTION_KEYS
// and SECTION_LABELS, and register a component for it in the theme. Existing profiles pick the
// new key up automatically (see normalizeSectionConfig), shown and placed last.
export const SECTION_KEYS = ['about', 'skills', 'experience', 'projects', 'education'] as const;
export const sectionKeySchema = z.enum(SECTION_KEYS);
export type SectionKey = z.infer<typeof sectionKeySchema>;

// The heading used when a section has no title of its own.
export const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
};

export const SECTION_TITLE_MAX = 40;

export const sectionConfigItemSchema = z.object({
  key: sectionKeySchema,
  visible: z.boolean(),
  // Optional: blank or missing means "use the default heading". Blank is stored as missing.
  title: z
    .string()
    .trim()
    .max(SECTION_TITLE_MAX)
    .nullish()
    .transform((title) => title || undefined),
});

// Known keys only, each at most once. The order of the array is the order on the page.
export const sectionConfigSchema = z
  .array(sectionConfigItemSchema)
  .max(SECTION_KEYS.length)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.key)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'key'],
          message: `Each section can appear only once (${item.key} is repeated)`,
        });
      }
      seen.add(item.key);
    });
  });
export type SectionConfigItem = z.infer<typeof sectionConfigItemSchema>;
export type SectionConfig = SectionConfigItem[];

// Everything visible, in the built-in order. The database column defaults to the same list.
export const defaultSectionConfig = (): SectionConfig =>
  SECTION_KEYS.map((key) => ({ key, visible: true }));

// Turns whatever is stored (or sent) into a complete, valid config: bad or repeated entries are
// dropped, and any known section that is missing is added at the end, visible. So an old profile
// gets sections introduced later, and a damaged value can never break the page.
export function normalizeSectionConfig(raw: unknown): SectionConfig {
  const seen = new Set<SectionKey>();
  const items: SectionConfig = [];
  for (const entry of Array.isArray(raw) ? raw : []) {
    const parsed = sectionConfigItemSchema.safeParse(entry);
    if (!parsed.success || seen.has(parsed.data.key)) continue;
    seen.add(parsed.data.key);
    items.push(parsed.data);
  }
  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) items.push({ key, visible: true });
  }
  return items;
}

// The sections a visitor sees: visible ones only, in order. Used by the public API and by the
// editor's live preview, so both agree.
export const visibleSections = (config: SectionConfig): PublicSection[] =>
  config
    .filter((section) => section.visible)
    .map(({ key, title }) => ({ key, ...(title && { title }) }));

// PUT /profile/me/sections
export const sectionsUpdateSchema = z.object({ sections: sectionConfigSchema });
export type SectionsUpdateInput = z.infer<typeof sectionsUpdateSchema>;

// What a visitor gets: only the visible sections, in order. `key` is a plain string here so a
// page built before a new section existed skips it instead of failing to load.
export const publicSectionSchema = z.object({
  key: z.string(),
  title: z.string().optional(),
});
export type PublicSection = z.infer<typeof publicSectionSchema>;
