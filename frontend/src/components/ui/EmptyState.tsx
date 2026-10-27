import type { ReactNode } from 'react';
import { cx } from './cx';

// What a list says when it has nothing in it yet: what is missing, and what to do about it.
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('space-y-2 text-sm text-muted', className)}>
      {title && <p className="font-medium text-ink">{title}</p>}
      <p>{children}</p>
      {action}
    </div>
  );
}
