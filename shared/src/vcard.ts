// A vCard 3.0 writer, small and with no dependencies. It is used by the "Add to contacts" file and by
// the contact QR code, in the browser and on the server.
//
// Why 3.0 and not 4.0: every contact app reads 3.0 (Apple Contacts, Google Contacts, Outlook, Android),
// while 4.0 support is still patchy (Outlook, and older Android versions, import 4.0 files badly or
// drop fields). 4.0 mostly adds things this card does not need. The cost is that 3.0 has no way to
// say a name's language, and photos are inline only (ENCODING=b), which is also what the apps read.
//
// The rules that parsers are strict about (RFC 2425 and 2426):
//  - lines end in CRLF, and a line is at most 75 octets: longer ones are folded, the next line starting
//    with one space. A fold never falls inside a UTF-8 character;
//  - in text values a backslash, a semicolon, a comma and a line break are written \\ \; \, and \n;
//  - control characters have no place in a value.

export interface VCardLink {
  label: string; // "LinkedIn": what the app shows next to the address
  url: string;
}

export interface VCardInput {
  fullName: string;
  title?: string | null;
  url: string; // the portfolio, as an absolute address
  emails?: string[];
  phones?: string[];
  links?: VCardLink[]; // more addresses, each with a label
  location?: string | null; // one free-text place, such as "Pune, India"
  note?: string | null;
  photoJpegBase64?: string | null; // a small JPEG, base64 without line breaks
  revision?: Date;
  uid?: string;
}

export interface VCardOptions {
  fold?: boolean; // false for a QR code, where nothing reads the lines by eye
}

// ---- cleaning and escaping

// C0 and C1 controls, line and paragraph separators, the bidi embedding and override marks, the
// direction marks, the word joiner and the byte order mark. Zero-width joiners are kept: Hindi and
// other Indic scripts need them. A line break is kept here and turned into a space or \n later.
const isUnsafe = (code: number) =>
  (code <= 0x1f && code !== 0x0a) ||
  (code >= 0x7f && code <= 0x9f) ||
  code === 0x061c ||
  code === 0x200e ||
  code === 0x200f ||
  code === 0x2028 ||
  code === 0x2029 ||
  (code >= 0x202a && code <= 0x202e) ||
  code === 0x2060 ||
  (code >= 0x2066 && code <= 0x2069) ||
  code === 0xfeff;

const clean = (value: string) =>
  Array.from(value.replace(/\r\n?/g, '\n'), (c) => (isUnsafe(c.codePointAt(0)!) ? ' ' : c)).join(
    '',
  );

// One line of text: line breaks and runs of spaces become one space.
const oneLine = (value: string) => clean(value).replace(/\s+/g, ' ').trim();

// Several lines: breaks are kept (written as \n) and each line is trimmed.
const block = (value: string) =>
  clean(value)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

export const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// ---- folding

const utf8Length = (char: string) => {
  const code = char.codePointAt(0)!;
  return code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
};

// Lines of at most 75 octets, counting the leading space of a continuation line. Characters are taken
// whole (a Hindi letter is 3 octets, an emoji 4), so no sequence is ever cut in two.
export function foldLine(line: string): string {
  const lines: string[] = [];
  let current = '';
  let octets = 0;
  let room = 75;
  for (const char of line) {
    const size = utf8Length(char);
    if (octets + size > room) {
      lines.push(current);
      current = '';
      octets = 0;
      room = 74;
    }
    current += char;
    octets += size;
  }
  lines.push(current);
  return lines.join('\r\n ');
}

// ---- the name

// Words that begin a family name when they are not the first word: "Ludwig van Beethoven".
const PARTICLES = new Set([
  'van',
  'von',
  'de',
  'del',
  'della',
  'di',
  'da',
  'dos',
  'das',
  'du',
  'la',
  'le',
  'bin',
  'ibn',
  'al',
  'el',
  'ter',
  'ten',
  'der',
  'den',
]);
const PREFIXES = new Set(['mr', 'mrs', 'ms', 'miss', 'mx', 'dr', 'prof', 'shri', 'smt', 'sri']);
const SUFFIX = /^(jr|sr|ii|iii|iv|phd|md)\.?$/i;
// A word of a name: letters and marks (so Devanagari vowel signs count) with an apostrophe, hyphen or
// period inside. Digits, & and emoji are not names, so a "name" with them is not split.
const isNameChar = (char: string, first: boolean) => {
  const code = char.codePointAt(0)!;
  if (/[\p{L}\p{M}]/u.test(char)) return true;
  // Zero-width (non-)joiners are part of Indic words; an apostrophe, hyphen or period only inside.
  return (
    !first &&
    (code === 0x200c ||
      code === 0x200d ||
      code === 0x27 ||
      code === 0x2019 ||
      code === 0x2e ||
      code === 0x2d)
  );
};
const NAME_WORD = {
  test: (word: string) => word !== '' && Array.from(word).every((c, i) => isNameChar(c, i === 0)),
};
// Arabic and Hebrew names often have patronymics and no fixed order, so they are never split.
const RTL_RANGES = [
  [0x0590, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfeff],
];
const RTL = {
  test: (word: string) =>
    Array.from(word).some((c) =>
      RTL_RANGES.some(([lo, hi]) => c.codePointAt(0)! >= lo && c.codePointAt(0)! <= hi),
    ),
};

export interface NameParts {
  family: string;
  given: string;
  additional: string;
  prefix: string;
  suffix: string;
}

// The parts of a name, or null when it cannot be split safely: then the card carries the full name
// only (FN) and leaves N empty, rather than guessing. Many names do not fit "first last".
export function splitName(fullName: string): NameParts | null {
  const words = oneLine(fullName).split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 5) return null;
  if (!words.every((word) => NAME_WORD.test(word))) return null;
  if (words.some((word) => RTL.test(word))) return words.length === 1 ? single(words[0]) : null;

  const prefix: string[] = [];
  while (words.length > 1 && PREFIXES.has(words[0].replace(/\.$/, '').toLowerCase())) {
    prefix.push(words.shift()!);
  }
  const suffix: string[] = [];
  while (words.length > 1 && SUFFIX.test(words[words.length - 1])) suffix.unshift(words.pop()!);

  if (words.length === 1) return single(words[0], prefix, suffix);

  const particle = words.findIndex(
    (word, i) => i >= 1 && word === word.toLowerCase() && PARTICLES.has(word),
  );
  const familyFrom = particle > 0 ? particle : words.length - 1;
  return {
    given: words[0],
    additional: words.slice(1, familyFrom).join(' '),
    family: words.slice(familyFrom).join(' '),
    prefix: prefix.join(' '),
    suffix: suffix.join(' '),
  };
}

// One word: it is a given name (a mononym is how people say it), with no family name.
const single = (word: string, prefix: string[] = [], suffix: string[] = []): NameParts => ({
  given: word,
  family: '',
  additional: '',
  prefix: prefix.join(' '),
  suffix: suffix.join(' '),
});

// ---- the file

const WEB_URL = /^https?:\/\/\S+$/i;
const EMAIL = /^[^\s@<>"'?&,;:()[\]\\]+@[^\s@<>"'?&,;:()[\]\\]+\.[^\s@<>"'?&,;:()[\]\\]+$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const webUrl = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim();
  // \S rules out spaces and line breaks; the other unsafe characters are checked here.
  const safe = Array.from(trimmed).every((c) => !isUnsafe(c.codePointAt(0)!));
  return safe && WEB_URL.test(trimmed) ? trimmed : null;
};

const dialable = (value: string) => {
  const kept = oneLine(value)
    .replace(/[^\d+()\-. ]/g, '')
    .trim();
  return kept.replace(/\D/g, '').length >= 5 ? kept : null;
};

// REV in the form 3.0 allows: 2026-11-02T10:15:00Z.
const revision = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

export function buildVCard(input: VCardInput, options: VCardOptions = {}): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0', 'PRODID:-//Parichay//Contact card//EN'];
  const add = (name: string, value: string, params = '') => lines.push(`${name}${params}:${value}`);

  const fullName = oneLine(input.fullName);
  const uid = webUrl(input.uid ?? input.url);
  if (uid) add('UID', uid);

  const parts = splitName(fullName);
  add(
    'N',
    parts
      ? [parts.family, parts.given, parts.additional, parts.prefix, parts.suffix]
          .map(escapeText)
          .join(';')
      : ';;;;',
  );
  add('FN', escapeText(fullName));

  const title = oneLine(input.title ?? '');
  if (title) add('TITLE', escapeText(title));

  for (const email of input.emails ?? []) {
    const address = oneLine(email);
    if (EMAIL.test(address)) add('EMAIL', escapeText(address), ';TYPE=INTERNET');
  }
  for (const phone of input.phones ?? []) {
    const number = dialable(phone);
    if (number) add('TEL', escapeText(number), ';TYPE=VOICE');
  }

  const url = webUrl(input.url);
  if (url) add('URL', url);

  const location = oneLine(input.location ?? '');
  // ADR is street, extended, ... The place is one string, so it goes in the locality only.
  if (location) add('ADR', `;;;${escapeText(location)};;;`);

  const note = block(input.note ?? '');
  if (note) add('NOTE', escapeText(note));

  // More addresses, each in an item group so the app can show its label (Apple Contacts reads
  // X-ABLabel; Google Contacts does too; Outlook keeps the first address only).
  let item = 0;
  for (const link of input.links ?? []) {
    const address = webUrl(link.url);
    if (!address || address === url) continue;
    item += 1;
    add(`item${item}.URL`, address);
    const label = oneLine(link.label);
    if (label) add(`item${item}.X-ABLabel`, escapeText(label));
  }

  // The photo is inline: Apple Contacts and Outlook ignore a linked picture, Google Contacts is
  // patchy with them, and all three read an embedded JPEG.
  const photo = (input.photoJpegBase64 ?? '').replace(/\s+/g, '');
  if (photo && BASE64.test(photo)) add('PHOTO', photo, ';ENCODING=b;TYPE=JPEG');

  add('REV', revision(input.revision ?? new Date()));
  lines.push('END:VCARD');

  const out = options.fold === false ? lines : lines.map(foldLine);
  return out.join('\r\n') + '\r\n';
}

// ---- the file name

// "Ayush Gill" -> "ayush-gill.vcf", for the plain filename="..." that every browser reads. When the
// name has letters outside ASCII, `utf8` is the name as written, for filename*=UTF-8''...
export function vcardFileNames(
  fullName: string,
  fallback: string,
): { ascii: string; utf8: string | null } {
  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  const ascii = `${slug(fullName) || slug(fallback) || 'contact'}.vcf`;
  const written = oneLine(fullName)
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 80);
  const plain = /^[ -~]*$/.test(written);
  return { ascii, utf8: !written || plain ? null : `${written}.vcf` };
}

// The value of a Content-Disposition header for the file.
export function vcardDisposition(fullName: string, fallback: string): string {
  const { ascii, utf8 } = vcardFileNames(fullName, fallback);
  const encoded = utf8
    ? `; filename*=UTF-8''${encodeURIComponent(utf8).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`
    : '';
  return `attachment; filename="${ascii}"${encoded}`;
}
