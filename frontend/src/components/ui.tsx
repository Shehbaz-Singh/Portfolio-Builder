'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useSlow } from '@/lib/hooks';

const base =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-indigo-400';

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
  danger:
    'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
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
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800 dark:focus-visible:outline-indigo-400';

// Shown while a request is slow, so a sleeping free-tier server does not look like a crash.
export function SlowNotice({ pending }: { pending: boolean }) {
  const slow = useSlow(pending);
  return (
    <p role="status" className="text-sm text-slate-600 dark:text-slate-400">
      {pending && slow
        ? 'Still working. The server wakes up after a quiet spell, which can take up to a minute.'
        : ''}
    </p>
  );
}

export function ErrorText({ children }: { children?: string }) {
  return children ? (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  ) : null;
}
