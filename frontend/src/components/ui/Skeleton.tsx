import { cx } from './cx';

// A placeholder bar for content that is on its way. Give it a size with className. It is hidden
// from screen readers: say what is loading in text next to it.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('animate-pulse rounded-control bg-surface', className)} />
  );
}
