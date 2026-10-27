import type { ComponentType, ReactNode } from 'react';
import { Globe, Link2, Mail, Phone } from 'lucide-react';
import type { PublicLink } from '@portfolio/shared';
import { formatMonthYear, initials } from '@/lib/format';
import type { Entry, HeaderModel } from './blocks';

// Small pieces every theme uses, so the markup that matters (dates as <time>, links that open in a
// new tab, the photo or the initials, the icon on a link) is the same everywhere. Layout and
// styling stay in the theme.

// "Apr 2023 – Apr 2026", "Mar 2022 – Present" (for open-ended jobs), or just "Mar 2022".
export function DateRange({
  start,
  end,
  openEnded = false,
}: Pick<Entry, 'start' | 'end'> & { openEnded?: boolean }) {
  if (!start) return null;
  return (
    <>
      <time dateTime={start}>{formatMonthYear(start)}</time>
      {end ? (
        <>
          {' – '}
          <time dateTime={end}>{formatMonthYear(end)}</time>
        </>
      ) : (
        openEnded && ' – Present'
      )}
    </>
  );
}

// An address on another site: new tab, no opener, and the new tab announced to screen readers.
export function NewTabLink({
  href,
  className,
  context,
  children,
}: {
  href: string;
  className?: string;
  context?: string; // what the link is about, read out after the visible text
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only">{context ? ` ${context}` : ''} (opens in a new tab)</span>
    </a>
  );
}

// The photo, or the initials in a circle when there is none. The theme gives it its size and look.
export function Avatar({
  avatar,
  className,
  placeholderClassName,
}: {
  avatar: HeaderModel['avatar'];
  className: string; // applied to both
  placeholderClassName: string; // extra, for the initials circle
}) {
  if (avatar.src) {
    return (
      // A plain <img>: avatars come from Cloudinary (already 400px) or any host the user chose,
      // which next/image could not allow-list.
      <img
        src={avatar.src}
        alt={avatar.alt}
        width={160}
        height={160}
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} flex items-center justify-center select-none ${placeholderClassName}`}
    >
      {avatar.initials}
    </div>
  );
}

// Initials in a small circle, for a person without a photo (the author of a testimonial).
export function InitialsBadge({ name, className }: { name: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold select-none ${className}`}
    >
      {initials(name)}
    </span>
  );
}

// ---- Link icons. lucide-react has no brand logos, so GitHub and LinkedIn are drawn here (the
// official marks, as single paths); the rest are lucide icons.
type IconProps = { className?: string };

function GitHubLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const LINK_ICONS: Record<PublicLink['type'], ComponentType<IconProps>> = {
  linkedin: LinkedInLogo,
  github: GitHubLogo,
  email: Mail,
  phone: Phone,
  website: Globe,
  other: Link2,
};

// A header link: its icon, then its label. The look (pill, plain text) comes from `className`.
// The icon is decoration; the label is what is read out.
export function HeaderLink({
  link,
  className,
}: {
  link: HeaderModel['links'][number];
  className: string;
}) {
  const Icon = LINK_ICONS[link.type];
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Icon className="size-4" />
      </span>
      {link.label}
    </>
  );
  return link.external ? (
    <NewTabLink href={link.href} className={className}>
      {content}
    </NewTabLink>
  ) : (
    <a href={link.href} className={className}>
      {content}
    </a>
  );
}

// A page with nothing in it yet (a new or emptied profile): say so instead of ending after the header.
export function EmptyPage({ className }: { className?: string }) {
  return <p className={className}>This portfolio is still being put together.</p>;
}
