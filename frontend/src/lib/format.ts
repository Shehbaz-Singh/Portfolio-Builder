import type { PublicLink } from '@portfolio/shared';

// UTC, so "2022-03-01" shows as Mar 2022 in every timezone.
const monthYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));

// "Mar 2022 – Present". With no end date: "Present" when `openEnded`, else just the start.
export const formatRange = (start: string, end: string | null, openEnded = true) =>
  end
    ? `${formatMonthYear(start)} – ${formatMonthYear(end)}`
    : openEnded
      ? `${formatMonthYear(start)} – Present`
      : formatMonthYear(start);

// "Jane Q. Doe" -> "JD"
export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

// Only http(s) URLs may become links. The API already enforces this, but a value that slipped
// in before the rule existed (say "javascript:...") must never reach an href.
export function safeHttpUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const LINK_LABELS: Record<PublicLink['type'], string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  other: '',
};

// Turns a stored link into a button: where it goes and what it says. null = do not render.
export function linkTarget(
  link: PublicLink,
): { href: string; label: string; external: boolean } | null {
  switch (link.type) {
    case 'email':
      return { href: `mailto:${link.url}`, label: LINK_LABELS.email, external: false };
    case 'phone':
      return {
        href: `tel:${link.url.replace(/[^\d+]/g, '')}`,
        label: LINK_LABELS.phone,
        external: false,
      };
    default: {
      const href = safeHttpUrl(link.url);
      if (!href) return null;
      return { href, label: LINK_LABELS[link.type] || hostOf(href), external: true };
    }
  }
}
