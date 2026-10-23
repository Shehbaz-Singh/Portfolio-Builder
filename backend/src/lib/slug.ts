import { randomBytes } from 'node:crypto';
import { RESERVED_SLUGS } from '@portfolio/shared';

const MAX_BASE_LENGTH = 24; // leaves room for a "-xxxx" suffix inside the 30 char slug limit

// "Jane O'Doe!" -> "jane-o-doe". Always returns at least 3 characters and never a reserved word.
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
  if ((RESERVED_SLUGS as readonly string[]).includes(base)) base = `${base}-user`;
  return base;
}

export function randomSuffix(): string {
  return randomBytes(3).toString('hex').slice(0, 4);
}
