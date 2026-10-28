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

const MAX_TITLE_SLUG = 60; // the column holds 80, leaving room for a "-NN" counter

// "Why I stopped using Redux!" -> "why-i-stopped-using-redux": for a post. Falls back to "post" when
// the title has no letters or digits (say, only emoji). Uniqueness is handled by post.service.
export function slugifyTitle(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TITLE_SLUG)
    .replace(/-+$/g, '');
  return base || 'post';
}
