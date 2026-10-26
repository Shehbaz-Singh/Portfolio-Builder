'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useSlow } from '@/lib/hooks';

const base =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent/90',
  secondary: 'border border-line hover:bg-surface',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50',
  ghost: 'hover:bg-surface',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export const inputClass =
  'block w-full rounded-lg border border-line bg-page px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent disabled:bg-surface disabled:text-muted';

export function Switch({
  checked,
  label,
  disabled,
  onClick,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
        checked ? 'bg-accent' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-page transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

// Shown while a request is slow, so a sleeping free-tier server does not look like a crash.
export function SlowNotice({ pending }: { pending: boolean }) {
  const slow = useSlow(pending);
  return (
    <p role="status" className="text-sm text-muted">
      {pending && slow
        ? 'Still working. The server wakes up after a quiet spell, which can take up to a minute.'
        : ''}
    </p>
  );
}

export function ErrorText({ children }: { children?: string }) {
  return children ? (
    <p role="alert" className="text-sm text-red-700">
      {children}
    </p>
  ) : null;
}
