'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import { cx } from './cx';

// Text fields share one look. A field with aria-invalid gets the error border, so the red and the
// announcement to screen readers can never disagree.
const field = cx(
  'block w-full rounded-control border border-line bg-page px-3 py-2 text-sm',
  'placeholder:text-muted disabled:bg-surface disabled:text-muted aria-invalid:border-danger',
);

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cx(field, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cx(field, 'resize-y', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cx(field, className)} {...props} />;
}

// An input that takes focus when it appears. For a field the person has just opened (rename,
// new section): they asked for it, so the keyboard should land there.
export function FocusedInput(props: ComponentProps<'input'>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return <Input ref={ref} {...props} />;
}
