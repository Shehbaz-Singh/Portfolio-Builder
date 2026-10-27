import type { ComponentProps } from 'react';
import { cx } from './cx';

const tones = {
  neutral: 'bg-surface text-ink',
  solid: 'bg-ink text-page', // a count that must stand out, such as pending items
  accent: 'bg-accent-soft text-ink',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'bg-danger-bg text-danger',
};

// A small label or count. Meaning is never carried by the color alone: put the word in it, or an
// sr-only word next to a number.
export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
