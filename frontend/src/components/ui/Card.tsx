import type { ComponentProps, ElementType } from 'react';
import { cx } from './cx';

// A box that groups content. Its padding and radius come from the tokens, so every panel in the
// app has the same proportions: `sm` for a row, `md` for a panel, `lg` for an empty or hero box.
const tones = {
  default: 'border border-line',
  accent: 'border border-accent/50',
  tint: 'bg-accent-soft text-ink',
  warning: 'bg-warning-bg text-warning-fg',
  danger: 'border border-danger-border',
  'danger-soft': 'bg-danger-bg',
};

// With `dashed`, the border is dashed ("drop here", "suggestions") in the tone's own color.
const dashedTones: Partial<Record<keyof typeof tones, string>> = {
  default: 'border border-dashed border-line',
  accent: 'border border-dashed border-accent/50',
  tint: 'border border-dashed border-accent/50 bg-accent-soft',
};

const paddings = {
  sm: 'p-card-sm rounded-box',
  md: 'p-card rounded-card',
  lg: 'p-card-lg rounded-card',
};

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: keyof typeof tones;
  padding?: keyof typeof paddings;
  dashed?: boolean;
} & Omit<ComponentProps<T>, 'as'>;

export function Card<T extends ElementType = 'div'>({
  as,
  tone = 'default',
  padding = 'md',
  dashed = false,
  className,
  ...props
}: CardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      className={cx((dashed && dashedTones[tone]) || tones[tone], paddings[padding], className)}
      {...props}
    />
  );
}
