import { contrastRatio, mix, normalizeHex, readableTextOn } from '../color';
import { DEFAULT_ACCENT } from '@parichay/shared';
import {
  EMAIL,
  dialable,
  esc,
  httpsUrl,
  isRtlText,
  languageOfText,
  text as clean,
} from './sanitize';

// Builds the HTML of an email signature. Mail apps strip or ignore most of what a web page uses, so
// the output sticks to what they all keep: nested tables for layout, inline styles only, real text,
// a system font, and absolute https addresses. There is no <style>, class, script, SVG, background
// image, web font or tracking of any kind, and text is never turned into an image.
//
// Text color is left to the reader's mail app (it inherits), so the text is legible in both light
// and dark mode. Only the links carry a color, and the accent is nudged until it reads on white.

export const SIGNATURE_STYLES = [
  { key: 'plain', name: 'Plain', hint: 'Text only, on one line. The most reliable.' },
  {
    key: 'letterhead',
    name: 'Letterhead',
    hint: 'An accent rule, a large name, details in a table.',
  },
  { key: 'card', name: 'Card', hint: 'A bordered block: photo, accent bar, text.' },
  { key: 'stacked', name: 'Stacked', hint: 'Photo above centered text. Good on phones.' },
  { key: 'banner', name: 'Banner', hint: 'Text, then a full-width badge strip.' },
  { key: 'initials', name: 'Initials', hint: 'Your initials in an accent square. No images.' },
  { key: 'bilingual', name: 'Bilingual', hint: 'Role and page link in two languages.' },
  { key: 'reply', name: 'Reply', hint: 'One short line for replies and forwards.' },
] as const;
export type SignatureStyle = (typeof SIGNATURE_STYLES)[number]['key'];

export const FIELD_KEYS = [
  'role',
  'location',
  'portfolio',
  'email',
  'phone',
  'linkedin',
  'github',
  'website',
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const CUSTOM_LINE_MAX = 80;
export const NAME_MAX = 100;
export const ROLE_MAX = 160;
export const LOCATION_MAX = 100;

const FONT = 'Arial,Helvetica,sans-serif;';
const SERIF = "Georgia,'Times New Roman',Times,serif;";
const NEUTRAL = '#c4c8cf'; // thin borders and dividers: decoration, never text
const AVATAR = 72; // CSS pixels; the picture is asked for at twice this
const BADGE = { width: 240, height: 64 }; // CSS pixels; the badge route draws it at twice this
const BANNER = { width: 480, height: 64 }; // the wide badge, drawn at twice this
const WHITE = '#ffffff';
export const DARK = '#1c1c1e'; // a typical dark message background

export interface SignatureSource {
  name: string;
  role: string; // the role line in the chosen language, before the owner edits it
  location: string | null;
  siteUrl: string;
  slug: string;
  locale: string;
  defaultLocale: string;
  avatarUrl: string | null;
  accent: string;
  // Only the contact details the owner shows on the page. Hidden ones never get here.
  contacts: Partial<Record<'email' | 'phone' | 'linkedin' | 'github' | 'website', string>>;
  // The other language of the Bilingual style, or null when the profile has no second one.
  second: { locale: string; role: string } | null;
}

export interface SignatureOptions {
  style: SignatureStyle;
  accent: string;
  role: string;
  customLine: string;
  fields: Record<FieldKey, boolean>;
  includeBadge: boolean; // Card and Stacked only; the Banner style always has the wide badge
  serifName: boolean; // the name in Georgia or Times
}

export interface Signature {
  html: string;
  text: string;
  bytes: number;
  usesImages: boolean;
  // Things that were left out and why, for the owner to read.
  skipped: string[];
  // The link color used, which may differ from the accent chosen.
  linkColor: string;
}

// The accent as a link color on white: kept if it reads (4.5:1), else darkened a step at a time.
export function linkColorFor(accent: string): string {
  const base = normalizeHex(accent) ?? DEFAULT_ACCENT;
  for (let towardBlack = 0; towardBlack < 1; towardBlack += 0.05) {
    const color = mix('#000000', base, towardBlack);
    if (contrastRatio(color, WHITE) >= 4.5) return color;
  }
  return '#000000';
}

export const contrastOnWhite = (hex: string) => contrastRatio(hex, WHITE);
export const contrastOnDark = (hex: string) => contrastRatio(hex, DARK);

// The avatar as a small square at twice its size, in a format every mail app draws. Only a picture
// from our own image host can be resized; any other address is left out.
function avatarSrc(avatarUrl: string | null): string | null {
  const url = httpsUrl(avatarUrl);
  if (!url || url.hostname !== 'res.cloudinary.com' || !url.pathname.includes('/image/upload/')) {
    return null;
  }
  const size = AVATAR * 2;
  const resize = `c_fill,g_auto,w_${size},h_${size},f_jpg,q_auto,b_white`;
  return url.href.replace('/image/upload/', `/image/upload/${resize}/`);
}

interface Item {
  key: FieldKey;
  label: string; // plain-text label
  display: string;
  href: string;
}

const hostOf = (url: URL) => url.hostname.replace(/^www\./, '');

export function buildSignature(source: SignatureSource, options: SignatureOptions): Signature {
  const { style, fields } = options;
  const skipped: string[] = [];
  // `rule` is the accent as chosen, for bars and fills. `accent` is for text and links.
  const rule = normalizeHex(options.accent) ?? DEFAULT_ACCENT;
  const accent = linkColorFor(rule);

  const name = clean(source.name, NAME_MAX);
  const role = fields.role ? clean(options.role, ROLE_MAX) : '';
  const location = fields.location ? clean(source.location, LOCATION_MAX) : '';
  const custom = clean(options.customLine, CUSTOM_LINE_MAX);
  const nameFont = options.serifName ? SERIF : FONT;

  const base = httpsUrl(source.siteUrl);
  const pathFor = (locale: string) =>
    locale === source.defaultLocale ? `/${source.slug}` : `/${source.slug}/${locale}`;
  const pageFor = (locale: string) => (base ? new URL(pathFor(locale), base) : null);
  const portfolio = pageFor(source.locale);
  const shown = (url: URL) => `${hostOf(url)}${url.pathname}`;

  const portfolioItem = (url: URL): Item => ({
    key: 'portfolio',
    label: 'Portfolio',
    display: shown(url),
    href: url.href,
  });

  const items: Item[] = [];
  if (fields.portfolio) {
    if (portfolio) items.push(portfolioItem(portfolio));
    else skipped.push('Portfolio link (this site is not on an https address)');
  }

  const { contacts } = source;
  if (fields.email && contacts.email) {
    const email = clean(contacts.email, 254);
    if (EMAIL.test(email)) {
      items.push({ key: 'email', label: 'Email', display: email, href: `mailto:${email}` });
    } else skipped.push('Email (not a valid address)');
  }
  if (fields.phone && contacts.phone) {
    const phone = clean(contacts.phone, 25);
    const dial = dialable(phone);
    if (dial) items.push({ key: 'phone', label: 'Phone', display: phone, href: `tel:${dial}` });
    else skipped.push('Phone (not a valid number)');
  }
  const web = [
    ['linkedin', 'LinkedIn', 'LinkedIn profile'],
    ['github', 'GitHub', 'GitHub profile'],
  ] as const;
  for (const [key, label, display] of web) {
    if (!fields[key] || !contacts[key]) continue;
    const url = httpsUrl(contacts[key]);
    if (url) items.push({ key, label, display, href: url.href });
    else skipped.push(`${label} (the address does not start with https://)`);
  }
  if (fields.website && contacts.website) {
    const url = httpsUrl(contacts.website);
    if (url) {
      items.push({ key: 'website', label: 'Website', display: hostOf(url), href: url.href });
    } else skipped.push('Website (the address does not start with https://)');
  }

  const nameLang = languageOfText(name, source.locale);
  const nameRtl = isRtlText(name);
  const roleLang = languageOfText(role, source.locale);
  const roleRtl = isRtlText(role);

  // ---- Building blocks

  const attrs = (lang: string | null, rtl: boolean) =>
    `${lang ? ` lang="${esc(lang)}"` : ''}${rtl ? ' dir="rtl"' : ''}`;
  const link = (item: Item) =>
    `<a href="${esc(item.href)}" rel="noopener noreferrer" style="color:${accent};text-decoration:underline;">${esc(item.display)}</a>`;
  const divider = `<span aria-hidden="true" style="color:${NEUTRAL};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`;
  const linkLine = (list: Item[]) => list.map(link).join(divider);

  const img = (src: string, w: number, h: number, alt: string, extra = '') =>
    `<img src="${esc(src)}" width="${w}" height="${h}" alt="${esc(alt)}" border="0" style="display:block;border:0;outline:none;text-decoration:none;width:${w}px;height:${h}px;${extra}">`;

  const table = (inner: string, extra = '', at = '') =>
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation"${at} style="border-collapse:collapse;font-family:${FONT}${extra}">${inner}</table>`;
  interface CellOptions {
    size?: number;
    height?: number;
    pad?: string;
    extra?: string;
    at?: string;
    font?: string;
  }
  const td = (inner: string, o: CellOptions = {}) =>
    `<td${o.at ?? ''} style="font-family:${o.font ?? FONT}font-size:${o.size ?? 13}px;line-height:${o.height ?? 20}px;padding:${o.pad ?? '0'};${o.extra ?? ''}">${inner}</td>`;
  const tr = (inner: string) => `<tr>${inner}</tr>`;
  const some = (parts: (string | false)[]) => parts.filter(Boolean).join('');
  const nameSpan = `<span${attrs(nameLang, nameRtl)} style="font-weight:bold;font-family:${nameFont}">${esc(name)}</span>`;
  const roleSpan = `<span${attrs(roleLang, roleRtl)}>${esc(role)}</span>`;

  // The name, role, place, links and extra line, one to a row.
  const lines = (center = false) => {
    const al = center ? 'text-align:center;' : '';
    const at = center ? ' align="center"' : '';
    return table(
      some([
        name &&
          tr(
            td(esc(name), {
              size: 16,
              height: 22,
              pad: '0 0 2px 0',
              extra: `font-weight:bold;${al}`,
              at: attrs(nameLang, nameRtl) + at,
              font: nameFont,
            }),
          ),
        role && tr(td(esc(role), { size: 14, extra: al, at: attrs(roleLang, roleRtl) + at })),
        location && tr(td(esc(location), { height: 18, extra: al, at })),
        items.length > 0 && tr(td(linkLine(items), { pad: '6px 0 0 0', extra: al, at })),
        custom && tr(td(esc(custom), { height: 18, pad: '6px 0 0 0', extra: al, at })),
      ]),
      '',
      at,
    );
  };

  // ---- Images

  const wantsAvatar = style === 'card' || style === 'stacked';
  const avatar = wantsAvatar ? avatarSrc(source.avatarUrl) : null;
  if (wantsAvatar && !avatar) {
    skipped.push(
      source.avatarUrl
        ? 'Photo (only photos uploaded here can be resized for email)'
        : 'Photo (you have not added one)',
    );
  }
  const photo = avatar ? img(avatar, AVATAR, AVATAR, `Photo of ${name || source.slug}`) : '';

  const wide = style === 'banner';
  const wantsBadge = wide || ((style === 'card' || style === 'stacked') && options.includeBadge);
  let badge = '';
  if (wantsBadge) {
    if (base && portfolio) {
      const route = `/badge/${source.slug}${source.locale === source.defaultLocale ? '' : `/${source.locale}`}${wide ? '/wide' : ''}`;
      const size = wide ? BANNER : BADGE;
      const alt = `View ${name || source.slug}’s portfolio at ${shown(portfolio)}`;
      const fit = wide ? 'max-width:100%;height:auto;' : '';
      badge = `<a href="${esc(portfolio.href)}" rel="noopener noreferrer" style="text-decoration:none;border:0;">${img(new URL(route, base).href, size.width, size.height, alt, fit)}</a>`;
    } else {
      skipped.push('Badge (this site is not on an https address)');
    }
  }
  const badgeRow = (center = false) =>
    badge
      ? tr(`<td${center ? ' align="center"' : ''} style="padding:10px 0 0 0;">${badge}</td>`)
      : '';

  // ---- The eight layouts

  const second = fields.role || fields.portfolio ? source.second : null;
  const secondRole = second && fields.role ? clean(second.role, ROLE_MAX) : '';
  const secondPage = second ? pageFor(second.locale) : null;

  let html: string;
  switch (style) {
    case 'plain': {
      const bits = [
        nameSpan,
        role && roleSpan,
        location && `<span>${esc(location)}</span>`,
        ...items.map(link),
      ];
      html = table(
        some([
          tr(td(bits.filter(Boolean).join(divider), { size: 14 })),
          custom && tr(td(esc(custom), { height: 18, pad: '4px 0 0 0' })),
        ]),
      );
      break;
    }

    case 'letterhead': {
      // Capitals and letter-spacing are for Latin letters: they break the joining of other scripts.
      const latin = languageOfText(role, 'en') === null;
      const detail = (label: string, value: string) =>
        tr(
          td(esc(label), {
            size: 12,
            height: 18,
            pad: '0 14px 0 0',
            extra: 'font-weight:bold;',
            at: ' valign="top"',
          }) + td(value, { height: 18, at: ' valign="top"' }),
        );
      const details = table(
        some([
          location && detail('Location', esc(location)),
          ...items.map((item) => detail(item.label, link(item))),
        ]),
      );
      html = table(
        some([
          tr(
            td(esc(name), {
              size: 22,
              height: 28,
              pad: '10px 0 2px 0',
              extra: `font-weight:bold;border-top:2px solid ${rule};`,
              at: attrs(nameLang, nameRtl),
              font: nameFont,
            }),
          ),
          role &&
            tr(
              td(esc(role), {
                size: 12,
                height: 18,
                pad: '0 0 10px 0',
                extra: latin ? 'text-transform:uppercase;letter-spacing:1px;' : '',
                at: attrs(roleLang, roleRtl),
              }),
            ),
          (location || items.length > 0) && tr(td(details)),
          custom && tr(td(esc(custom), { height: 18, pad: '8px 0 0 0' })),
        ]),
      );
      break;
    }

    case 'card': {
      const inner = avatar
        ? `<td valign="top" style="padding:0 14px 0 0;">${photo}</td><td valign="top" style="padding:0 0 0 14px;border-left:3px solid ${rule};">${lines()}</td>`
        : `<td valign="top" style="padding:0 0 0 12px;border-left:3px solid ${rule};">${lines()}</td>`;
      html = table(
        tr(`<td style="padding:12px;border:1px solid ${NEUTRAL};">${table(tr(inner))}</td>`) +
          badgeRow(),
      );
      break;
    }

    case 'stacked': {
      const top = avatar
        ? tr(
            `<td align="center" style="padding:0 0 8px 0;">${table(tr(`<td style="padding:0 0 6px 0;border-bottom:2px solid ${rule};">${photo}</td>`), '', ' align="center"')}</td>`,
          )
        : '';
      html = table(
        top + tr(`<td align="center" style="padding:0;">${lines(true)}</td>`) + badgeRow(true),
        'width:280px;max-width:100%;',
        ' width="280" align="center"',
      );
      break;
    }

    case 'banner': {
      html = table(
        tr(`<td style="padding:0;">${lines()}</td>`) + badgeRow(),
        'width:480px;max-width:100%;',
        ' width="480"',
      );
      break;
    }

    case 'initials': {
      const square = `<td width="56" height="56" align="center" valign="middle" bgcolor="${rule}"${attrs(nameLang, nameRtl)} style="font-family:${FONT}font-size:20px;line-height:56px;font-weight:bold;width:56px;height:56px;background-color:${rule};color:${readableTextOn(rule)};text-align:center;">${esc(initialsOf(name))}</td>`;
      html = table(tr(square + `<td valign="top" style="padding:0 0 0 14px;">${lines()}</td>`));
      break;
    }

    case 'bilingual': {
      if (!second) {
        html = lines();
        break;
      }
      const secondLang = languageOfText(secondRole, second.locale);
      const secondRtl = isRtlText(secondRole);
      // One column: the role in its language and the page in that language, with its own lang/dir.
      const column = (
        text: string,
        lang: string | null,
        rtl: boolean,
        page: URL | null,
        pad: string,
      ) =>
        td(
          some([
            text && esc(text),
            !!text && !!page && '<br>',
            page ? link(portfolioItem(page)) : '',
          ]),
          {
            size: 14,
            pad,
            extra: rtl ? 'text-align:right;' : '',
            at: ` valign="top" width="190"${attrs(lang, rtl)}`,
          },
        );
      const others = items.filter((item) => item.key !== 'portfolio');
      const rest = [location && esc(location), others.length > 0 && linkLine(others)]
        .filter(Boolean)
        .join(divider);
      html = table(
        some([
          name &&
            tr(
              td(esc(name), {
                size: 16,
                height: 22,
                pad: '0 0 4px 0',
                extra: 'font-weight:bold;',
                at: `${attrs(nameLang, nameRtl)} colspan="3"`,
                font: nameFont,
              }),
            ),
          tr(
            column(role, roleLang, roleRtl, fields.portfolio ? portfolio : null, '0 14px 0 0') +
              `<td width="1" style="padding:0;border-left:1px solid ${NEUTRAL};font-size:1px;line-height:1px;">&nbsp;</td>` +
              column(
                secondRole,
                secondLang,
                secondRtl,
                fields.portfolio ? secondPage : null,
                '0 0 0 14px',
              ),
          ),
          rest && tr(td(rest, { pad: '8px 0 0 0', at: ' colspan="3"' })),
          custom && tr(td(esc(custom), { height: 18, pad: '6px 0 0 0', at: ' colspan="3"' })),
        ]),
      );
      break;
    }

    case 'reply': {
      const bits = [nameSpan, role && roleSpan, items[0] && link(items[0])];
      html = table(tr(td(bits.filter(Boolean).join(divider))));
      break;
    }
  }

  // ---- Plain text

  const plain = (item: Item) =>
    item.key === 'email' || item.key === 'phone' ? item.display : item.href;
  const textVersion =
    style === 'reply'
      ? [name, role, items[0] && plain(items[0])].filter(Boolean).join(' | ')
      : style === 'plain'
        ? [[name, role, location, ...items.map(plain)].filter(Boolean).join(' | '), custom]
            .filter(Boolean)
            .join('\n')
        : [
            name,
            role,
            style === 'bilingual' ? secondRole : '',
            location,
            ...items.map((i) => `${i.label}: ${plain(i)}`),
            style === 'bilingual' && secondPage && fields.portfolio
              ? `Portfolio: ${secondPage.href}`
              : '',
            custom,
          ]
            .filter(Boolean)
            .join('\n');

  return {
    html,
    text: textVersion,
    bytes: new TextEncoder().encode(html).length,
    usesImages: Boolean(avatar || badge),
    skipped,
    linkColor: accent,
  };
}

// The letters of the initials square: the first letter of the first and last word, as a reader
// counts letters, so a letter with its marks stays whole.
function initialsOf(name: string): string {
  const first = (word: string) =>
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? ([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)][0]
          ?.segment ?? '')
      : (Array.from(word)[0] ?? '');
  const words = name.split(' ').filter(Boolean);
  const letters = [words[0], words.length > 1 ? words[words.length - 1] : ''].map((w) =>
    w ? first(w) : '',
  );
  return (letters.join('') || '?').toUpperCase();
}

// A whole page for the downloaded file. The charset line matters: without it a name in Devanagari
// or Arabic can open as garbage.
export function signatureDocument(html: string, title: string): string {
  return `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${esc(title)}</title>\n</head>\n<body>\n${html}\n</body>\n</html>\n`;
}
