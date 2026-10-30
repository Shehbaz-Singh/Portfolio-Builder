// Run with: npm test -w @parichay/shared (builds first, then tests the compiled code).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildVCard,
  contactCardInput,
  contactQrCard,
  escapeText,
  foldLine,
  hasContactLink,
  hiddenContactLinks,
  splitName,
  vcardDisposition,
  vcardFileNames,
} from '../dist/index.js';

const REV = new Date('2026-11-02T10:15:30.123Z');
const SITE = 'https://parichay.example/ayush-gill';
const make = (extra = {}) =>
  buildVCard({ fullName: 'Ayush Gill', url: SITE, revision: REV, ...extra });

// The logical lines of a card, after unfolding.
const unfold = (card) => card.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
const starts = (name) => (line) => line.startsWith(`${name}:`) || line.startsWith(`${name};`);
const prop = (card, name) => unfold(card).find(starts(name));
const all = (card, name) => unfold(card).filter(starts(name));

// What every card must satisfy, whatever is in it.
function assertWellFormed(card) {
  assert.ok(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(card.endsWith('END:VCARD\r\n'));
  assert.ok(!/(?<!\r)\n/.test(card), 'a bare LF');
  assert.ok(!/\r(?!\n)/.test(card), 'a bare CR');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const physical of card.split('\r\n')) {
    const bytes = new TextEncoder().encode(physical);
    assert.ok(bytes.length <= 75, `line over 75 octets: ${bytes.length}`);
    decoder.decode(bytes); // throws if a character was cut in two
  }
  const controls = Array.from(card).filter((c) => {
    const code = c.codePointAt(0);
    return (code < 32 && code !== 13 && code !== 10) || code === 127;
  });
  assert.deepEqual(controls, [], 'a control character');
  assert.ok(prop(card, 'FN') && prop(card, 'N'), 'N and FN are required');
}

test('a normal profile', () => {
  const card = make({
    title: 'Product designer',
    emails: ['ayush@example.com'],
    phones: ['+91 98765 43210'],
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ayush' },
      { label: 'GitHub', url: 'https://github.com/ayush' },
    ],
    location: 'Pune, India',
    note: `Added from ${SITE}`,
  });
  assertWellFormed(card);
  assert.equal(prop(card, 'N'), 'N:Gill;Ayush;;;');
  assert.equal(prop(card, 'FN'), 'FN:Ayush Gill');
  assert.equal(prop(card, 'TITLE'), 'TITLE:Product designer');
  assert.equal(prop(card, 'EMAIL'), 'EMAIL;TYPE=INTERNET:ayush@example.com');
  assert.equal(prop(card, 'TEL'), 'TEL;TYPE=VOICE:+91 98765 43210');
  assert.equal(prop(card, 'URL'), `URL:${SITE}`);
  assert.equal(prop(card, 'ADR'), 'ADR:;;;Pune\\, India;;;');
  assert.equal(prop(card, 'NOTE'), `NOTE:Added from ${SITE}`);
  assert.equal(prop(card, 'REV'), 'REV:2026-11-02T10:15:30Z');
  const lines = unfold(card);
  assert.ok(lines.includes('item1.URL:https://www.linkedin.com/in/ayush'));
  assert.ok(lines.includes('item1.X-ABLabel:LinkedIn'));
  assert.ok(lines.includes('item2.URL:https://github.com/ayush'));
  assert.ok(lines.includes('item2.X-ABLabel:GitHub'));
});

test('apostrophes, accents and ampersands', () => {
  for (const name of ["Siobhán O'Brien", 'José María Núñez', 'Tom & Jerry Co']) {
    const card = make({ fullName: name });
    assertWellFormed(card);
    assert.equal(prop(card, 'FN'), `FN:${name}`);
  }
  assert.equal(prop(make({ fullName: "Siobhán O'Brien" }), 'N'), "N:O'Brien;Siobhán;;;");
  // an ampersand is not part of a name, so the name is left unsplit
  assert.equal(prop(make({ fullName: 'Tom & Jerry Co' }), 'N'), 'N:;;;;');
});

test('particles, titles and suffixes', () => {
  assert.deepEqual(splitName('Ludwig van Beethoven'), {
    given: 'Ludwig',
    additional: '',
    family: 'van Beethoven',
    prefix: '',
    suffix: '',
  });
  assert.deepEqual(splitName('Dr. Mary Jane Watson Jr.'), {
    given: 'Mary',
    additional: 'Jane',
    family: 'Watson',
    prefix: 'Dr.',
    suffix: 'Jr.',
  });
  assert.equal(splitName('Anna de la Cruz').family, 'de la Cruz');
});

test('a single-word name', () => {
  const card = make({ fullName: 'Madonna' });
  assertWellFormed(card);
  assert.equal(prop(card, 'N'), 'N:;Madonna;;;');
  assert.equal(prop(card, 'FN'), 'FN:Madonna');
});

test('a very long name folds and stays whole', () => {
  const name = `${'Wolfeschlegelsteinhausenbergerdorff '.repeat(2).trim()} ${'x'.repeat(40)}`;
  const card = make({ fullName: name });
  assertWellFormed(card);
  assert.equal(prop(card, 'FN'), `FN:${name}`);
  // six or more words are not split
  assert.equal(prop(make({ fullName: 'a b c d e f' }), 'N'), 'N:;;;;');
});

test('Hindi, Arabic and Urdu names', () => {
  for (const name of ['आयुष गिल', 'محمد بن سلمان', 'عائشہ خان']) {
    const card = make({ fullName: name, title: name });
    assertWellFormed(card);
    assert.equal(prop(card, 'FN'), `FN:${name}`);
    assert.equal(prop(card, 'TITLE'), `TITLE:${name}`);
  }
  // Devanagari splits like Latin; Arabic and Urdu names are never guessed at
  assert.equal(prop(make({ fullName: 'आयुष गिल' }), 'N'), 'N:गिल;आयुष;;;');
  assert.equal(prop(make({ fullName: 'محمد بن سلمان' }), 'N'), 'N:;;;;');
  assert.equal(prop(make({ fullName: 'عائشہ خان' }), 'N'), 'N:;;;;');
  assert.equal(prop(make({ fullName: 'علي' }), 'N'), 'N:;علي;;;');
});

test('emoji', () => {
  const title = `Maker ${'🎨'.repeat(30)} of things`;
  const card = make({ fullName: 'Ayush 🚀 Gill', title });
  assertWellFormed(card);
  assert.equal(prop(card, 'FN'), 'FN:Ayush 🚀 Gill');
  assert.equal(prop(card, 'TITLE'), `TITLE:${title}`);
  // an emoji is not a letter, so the name is left unsplit
  assert.equal(prop(card, 'N'), 'N:;;;;');
});

test('a very long tagline folds without cutting a character', () => {
  for (const unit of ['abcdefghij', 'आयुष', 'مرحبا', '🚀🎨']) {
    const title = unit.repeat(60);
    const card = make({ title });
    assertWellFormed(card);
    assert.equal(prop(card, 'TITLE'), `TITLE:${title}`);
  }
  // every folded line starts with exactly one space
  const folded = make({ title: 'x'.repeat(300) })
    .split('\r\n')
    .filter((line) => line.startsWith(' '));
  assert.ok(folded.length >= 3);
  assert.ok(folded.every((line) => !line.startsWith('  ')));
});

test('commas, semicolons, backslashes and line breaks are escaped', () => {
  assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const card = make({
    fullName: 'Gill, Ayush; "Ace"',
    title: 'Design, build; ship\\repeat',
    note: 'Line one\r\nLine two\rLine three',
    location: 'Pune; India, Asia',
  });
  assertWellFormed(card);
  assert.equal(prop(card, 'TITLE'), 'TITLE:Design\\, build\\; ship\\\\repeat');
  assert.equal(prop(card, 'NOTE'), 'NOTE:Line one\\nLine two\\nLine three');
  assert.equal(prop(card, 'ADR'), 'ADR:;;;Pune\\; India\\, Asia;;;');
  assert.equal(prop(card, 'FN'), 'FN:Gill\\, Ayush\\; "Ace"');
});

test('control characters and direction overrides are stripped', () => {
  const card = make({ fullName: 'Ay\u0000ush‮ Gill\u0007', title: 'Line\u0001 one two' });
  assertWellFormed(card);
  assert.equal(prop(card, 'FN'), 'FN:Ay ush Gill');
  assert.equal(prop(card, 'TITLE'), 'TITLE:Line one two');
});

test('no visible links', () => {
  const source = { fullName: 'Ayush Gill', tagline: 'Designer', location: null, links: [] };
  const card = buildVCard(contactCardInput(source, { portfolioUrl: SITE, revision: REV }));
  assertWellFormed(card);
  assert.equal(all(card, 'EMAIL').length, 0);
  assert.equal(all(card, 'TEL').length, 0);
  assert.equal(all(card, 'ADR').length, 0);
  assert.equal(all(card, 'URL').length, 1);
  assert.equal(hasContactLink(source), false);
});

test('hidden links never reach the card', () => {
  const source = {
    fullName: 'Ayush Gill',
    tagline: null,
    location: null,
    links: [
      { type: 'email', url: 'hidden@example.com', visible: false },
      { type: 'phone', url: '+91 11111 22222', visible: false },
      { type: 'linkedin', url: 'https://linkedin.com/in/secret', visible: false },
      { type: 'github', url: 'https://github.com/shown', visible: true },
    ],
  };
  const card = buildVCard(contactCardInput(source, { portfolioUrl: SITE, revision: REV }));
  assertWellFormed(card);
  for (const secret of ['hidden@example.com', '11111', 'secret']) assert.ok(!card.includes(secret));
  assert.ok(card.includes('https://github.com/shown'));
  assert.deepEqual(
    hiddenContactLinks(source).map((link) => link.label),
    ['Email', 'Phone', 'LinkedIn'],
  );
});

test('no email', () => {
  const source = {
    fullName: 'Ayush Gill',
    tagline: null,
    location: null,
    links: [{ type: 'github', url: 'https://github.com/ayush' }],
  };
  const card = buildVCard(contactCardInput(source, { portfolioUrl: SITE, revision: REV }));
  assert.equal(all(card, 'EMAIL').length, 0);
  assert.ok(!contactQrCard(source, SITE).includes('EMAIL'));
});

test('invalid emails, numbers and addresses are left out', () => {
  const card = make({
    emails: ['not an email', 'a@b'],
    phones: ['12', 'call me'],
    links: [
      { label: 'Bad', url: 'javascript:alert(1)' },
      { label: 'Spaces', url: 'https://a.com/x y' },
    ],
  });
  assertWellFormed(card);
  assert.equal(all(card, 'EMAIL').length, 0);
  assert.equal(all(card, 'TEL').length, 0);
  assert.ok(!card.includes('item1'));
});

test('the photo is included or excluded', () => {
  const jpeg = Buffer.from(Array.from({ length: 4000 }, (_, i) => i % 251)).toString('base64');
  const withPhoto = make({ photoJpegBase64: jpeg });
  assertWellFormed(withPhoto);
  assert.ok(unfold(withPhoto).includes(`PHOTO;ENCODING=b;TYPE=JPEG:${jpeg}`));
  assert.ok(!make({}).includes('PHOTO'));
  assert.ok(!make({ photoJpegBase64: 'not base64!' }).includes('PHOTO'));
  // the mapping leaves it out unless it is given
  const source = { fullName: 'Ayush Gill', tagline: null, location: null, links: [] };
  assert.ok(!buildVCard(contactCardInput(source, { portfolioUrl: SITE })).includes('PHOTO'));
});

test('the QR card holds name, title, address and one email only', () => {
  const source = {
    fullName: 'Ayush Gill',
    tagline: 'Designer',
    location: 'Pune',
    links: [
      { type: 'email', url: 'a@example.com' },
      { type: 'email', url: 'b@example.com' },
      { type: 'phone', url: '+91 98765 43210' },
      { type: 'github', url: 'https://github.com/a' },
    ],
  };
  const text = contactQrCard(source, SITE);
  assert.ok(text.includes('FN:Ayush Gill') && text.includes('TITLE:Designer'));
  assert.ok(text.includes(`URL:${SITE}`));
  assert.ok(text.includes('a@example.com') && !text.includes('b@example.com'));
  assert.ok(!/TEL|ADR|PHOTO|github|NOTE/.test(text));
  assert.ok(text.length < 400);
});

test('foldLine counts octets, not characters', () => {
  assert.equal(foldLine('a'.repeat(75)), 'a'.repeat(75));
  assert.equal(foldLine('a'.repeat(76)), `${'a'.repeat(75)}\r\n a`);
  // 25 Devanagari letters are 75 octets; the 26th starts a new line
  assert.equal(foldLine('अ'.repeat(26)), `${'अ'.repeat(25)}\r\n अ`);
});

test('file names', () => {
  assert.deepEqual(vcardFileNames('Ayush Gill', 'x'), { ascii: 'ayush-gill.vcf', utf8: null });
  assert.deepEqual(vcardFileNames('José Núñez', 'x'), {
    ascii: 'jose-nunez.vcf',
    utf8: 'José Núñez.vcf',
  });
  assert.deepEqual(vcardFileNames('आयुष गिल', 'ayush-gill'), {
    ascii: 'ayush-gill.vcf',
    utf8: 'आयुष गिल.vcf',
  });
  assert.equal(vcardFileNames('///', 'slug').ascii, 'slug.vcf');
  assert.equal(
    vcardDisposition('आयुष', 'a'),
    `attachment; filename="a.vcf"; filename*=UTF-8''%E0%A4%86%E0%A4%AF%E0%A5%81%E0%A4%B7.vcf`,
  );
  assert.equal(vcardDisposition('Ayush Gill', 'a'), 'attachment; filename="ayush-gill.vcf"');
  assert.ok(!vcardDisposition('a"b\r\nSet-Cookie: x', 'a').includes('\n'));
});
