import { z } from 'zod';
import { MAX_CUSTOM_SECTIONS } from './custom-sections';

// Which sections the portfolio page shows, in what order, and under what heading. This is
// layout only: the content itself (skills, jobs, ...) is stored as before.
//
// Two kinds of key. The built-in sections have fixed keys. A section the user creates is
// "custom:<id>" (see custom-sections.ts); it appears here when it is created and goes when it is
// deleted. To add another built-in kind (testimonials, ...): append its key to SECTION_KEYS and
// SECTION_LABELS, and register a component for it in the theme. Existing profiles pick the new
// key up automatically (see normalizeSectionConfig), shown and placed after the others.
export const SECTION_KEYS = ['about', 'skills', 'experience', 'projects', 'education'] as const;
export const sectionKeySchema = z.enum(SECTION_KEYS);
export type SectionKey = z.infer<typeof sectionKeySchema>;

// The heading used when a built-in section has no title of its own.
export const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
};

export const SECTION_TITLE_MAX = 40;

// ---- custom section keys
const CUSTOM_PREFIX = 'custom:';
export type CustomKey = `${typeof CUSTOM_PREFIX}${string}`;
export type ConfigKey = SectionKey | CustomKey;

export const customKey = (id: string): CustomKey => `${CUSTOM_PREFIX}${id}`;
export const isCustomKey = (key: string): key is CustomKey => key.startsWith(CUSTOM_PREFIX);
export const customIdOf = (key: CustomKey) => key.slice(CUSTOM_PREFIX.length);

const customKeySchema = z.custom<CustomKey>(
  (value) => typeof value === 'string' && /^custom:[a-z0-9]{8,40}$/.test(value),
  'Not a valid section key',
);

export const sectionConfigItemSchema = z.object({
  key: z.union([sectionKeySchema, customKeySchema]),
  visible: z.boolean(),
  // Optional: blank or missing means "use the default heading". Blank is stored as missing.
  // Only for built-in sections: a custom section's heading is its own title.
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
  .max(SECTION_KEYS.length + MAX_CUSTOM_SECTIONS)
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

// Turns whatever is stored (or sent) into a complete, valid config. `customIds` are the ids of
// the profile's own custom sections: an entry for any other id (deleted, or someone else's) is
// dropped, and a custom section missing from the list is added at the end, visible. Bad or
// repeated entries are dropped, and any built-in section that is missing is added too. So the
// result always matches what exists, and a damaged value can never break the page.
export function normalizeSectionConfig(
  raw: unknown,
  customIds: readonly string[] = [],
): SectionConfig {
  const own = new Set(customIds);
  const seen = new Set<string>();
  const items: SectionConfig = [];

  for (const entry of Array.isArray(raw) ? raw : []) {
    const parsed = sectionConfigItemSchema.safeParse(entry);
    if (!parsed.success) continue;
    const { key, visible, title } = parsed.data;
    if (seen.has(key)) continue;
    if (isCustomKey(key)) {
      if (!own.has(customIdOf(key))) continue;
      items.push({ key, visible });
    } else {
      items.push({ key, visible, title });
    }
    seen.add(key);
  }

  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) items.push({ key, visible: true });
  }
  for (const id of customIds) {
    if (!seen.has(customKey(id))) items.push({ key: customKey(id), visible: true });
  }
  return items;
}

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
