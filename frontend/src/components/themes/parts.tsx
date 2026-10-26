import type { ReactNode } from 'react';
import { formatMonthYear } from '@/lib/format';
import type { Entry, HeaderModel } from './blocks';

// Small pieces every theme uses, so the markup that matters (dates as <time>, links that open in a
// new tab, the photo or the initials) is the same everywhere. Layout and styling stay in the theme.

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
        width={128}
        height={128}
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} flex items-center justify-center ${placeholderClassName}`}
    >
      {avatar.initials}
    </div>
  );
}
