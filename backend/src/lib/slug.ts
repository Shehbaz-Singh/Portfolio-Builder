const MAX_BASE_LENGTH = 24; // leaves room for a "-NNNNN" counter inside the 30 char slug limit

// "Jane O'Doe!" -> "jane-o-doe": lowercase, hyphenated, accents and special characters removed.
// Always at least 3 characters. Uniqueness and reserved words are handled by slug.service.
export function slugify(input: string): string {
  let base = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, '');

  if (base.length < 3) base = `user-${base}`.replace(/-+$/g, '');
  return base;
}
