import { z } from 'zod';
import { VALIDATION } from './messages';

// Plain text. Everything is stored and shown as text: markup is never interpreted (React
// escapes it when rendering), and control characters (a NUL byte makes Postgres reject the row)
// are removed here.
const isControl = (char: string) => {
  const code = char.charCodeAt(0);
  return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
};
const withoutControls = (text: string) => [...text].filter((char) => !isControl(char)).join('');

// One line: line breaks and runs of spaces become a single space.
const oneLine = (text: string) => withoutControls(text).replace(/\s+/g, ' ').trim();
// Several lines: line breaks are kept, Windows ones normalised.
const block = (text: string) => withoutControls(text).replace(/\r\n?/g, '\n').trim();

// The lengths are checked after the text is cleaned up, so they count what is stored.
const lengthRule = (min: number, max: number) =>
  z
    .string()
    .min(min, min > 1 ? VALIDATION.tooShort(min) : undefined)
    .max(max, VALIDATION.tooLong(max));

// The longest email address, as the standard has it.
export const EMAIL_MAX = 254;

export const requiredLine = (max: number, min = 1) =>
  z.string().transform(oneLine).pipe(lengthRule(min, max));

export const optionalLine = (max: number) =>
  z
    .string()
    .nullish()
    .transform((text) => (text ? oneLine(text) || null : null))
    .pipe(z.string().max(max).nullable());

export const requiredBlock = (max: number, min = 1) =>
  z.string().transform(block).pipe(lengthRule(min, max));

export const optionalBlock = (max: number) =>
  z
    .string()
    .nullish()
    .transform((text) => (text ? block(text) || null : null))
    .pipe(z.string().max(max).nullable());
