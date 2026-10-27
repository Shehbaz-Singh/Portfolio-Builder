import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

// What a list says when it has nothing in it yet: what is missing, and what to do about it. The
// icon is decoration (the words say it all), in a soft circle so a blank box feels intended.
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center gap-2 text-sm text-muted', className)}>
      {Icon && (
        <span
          aria-hidden="true"
          className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-fg"
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </span>
      )}
      {title && <p className="font-medium text-ink">{title}</p>}
      <p className="max-w-sm text-pretty">{children}</p>
      {action}
    </div>
  );
}
