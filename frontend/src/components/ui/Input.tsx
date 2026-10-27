'use client';

import { ChevronDown } from 'lucide-react';
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

// The list that opens is the browser's own (so it works with every keyboard and screen reader and
// on phones); the closed control gets the same look as the other fields, with our own arrow.
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cx(field, 'cursor-pointer appearance-none pe-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

// An input that takes focus when it appears. For a field the person has just opened (rename,
// new section): they asked for it, so the keyboard should land there.
export function FocusedInput(props: ComponentProps<'input'>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return <Input ref={ref} {...props} />;
}
