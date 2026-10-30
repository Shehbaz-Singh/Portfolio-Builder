import { buildVCard, type VCardInput, type VCardLink } from './vcard';

// What goes in the "Add to contacts" card, worked out from a profile. The public file, the owner's
// preview in the dashboard and the QR code all read this one function, so what the owner sees in the
// preview is what the file holds. Only links the owner shows are used: the public API leaves hidden
// ones out already, and the dashboard's own links are filtered here.

export interface ContactSource {
  fullName: string;
  tagline: string | null;
  location: string | null;
  links: { type: string; url: string; visible?: boolean }[];
}

export interface ContactCardOptions {
  portfolioUrl: string;
  note?: string | null;
  photoJpegBase64?: string | null;
  revision?: Date;
}

const LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  website: 'Website',
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

// What the app shows beside an address: the service for the known ones, the site's name otherwise.
export const contactLinkLabel = (type: string, url: string) =>
  LABELS[type] ?? (hostOf(url) || 'Link');

const shown = (source: ContactSource) => source.links.filter((link) => link.visible !== false);

export function contactCardInput(source: ContactSource, options: ContactCardOptions): VCardInput {
  const links = shown(source);
  const extra: VCardLink[] = links
    .filter((link) => link.type !== 'email' && link.type !== 'phone')
    .map((link) => ({ label: contactLinkLabel(link.type, link.url), url: link.url }));
  return {
    fullName: source.fullName,
    title: source.tagline,
    url: options.portfolioUrl,
    emails: links.filter((link) => link.type === 'email').map((link) => link.url),
    phones: links.filter((link) => link.type === 'phone').map((link) => link.url),
    links: extra,
    location: source.location,
    note: options.note ?? null,
    photoJpegBase64: options.photoJpegBase64 ?? null,
    revision: options.revision,
  };
}

// The short card for a QR code: name, title, address and one email. A QR code holds a few hundred
// characters before it gets too dense to scan from a distance, so nothing else goes in.
export function contactQrCard(source: ContactSource, portfolioUrl: string): string {
  const email = shown(source).find((link) => link.type === 'email');
  return buildVCard(
    {
      fullName: source.fullName,
      title: source.tagline,
      url: portfolioUrl,
      emails: email ? [email.url] : [],
    },
    { fold: false },
  );
}

// The links the owner has hidden, which the card leaves out.
export const hiddenContactLinks = (source: ContactSource) =>
  source.links
    .filter((link) => link.visible === false)
    .map((link) => ({
      type: link.type,
      label:
        link.type === 'email'
          ? 'Email'
          : link.type === 'phone'
            ? 'Phone'
            : contactLinkLabel(link.type, link.url),
    }));

// Whether the page shows any link at all. The button is only offered then: a card with just a name
// would not be worth saving.
export const hasContactLink = (source: Pick<ContactSource, 'links'>) =>
  source.links.some((link) => link.visible !== false);
