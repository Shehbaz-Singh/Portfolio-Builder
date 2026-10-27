import type { ComponentProps } from 'react';
import { cx } from './cx';

// Focus is not styled here: the global :focus-visible rule (globals.css) gives every control the
// same ring.
const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium transition disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent/90 active:bg-accent/75',
  secondary: 'border border-line hover:bg-surface active:bg-line',
  ghost: 'hover:bg-surface active:bg-line',
  danger: 'border border-danger-border text-danger hover:bg-danger-bg active:bg-danger-border',
};

// Both sizes keep the target at least 24 by 24 px.
const sizes = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-2 py-1 text-xs',
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

// The look of a button, for something that is a link: <Link className={buttonStyles({...})}>.
export const buttonStyles = ({
  variant = 'secondary',
  size = 'md',
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) => cx(base, variants[variant], sizes[size]);

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}

// `loading` shows a spinner before the label and disables the button, so a second click cannot
// send the request twice. The label stays (pass "Saving…" as the children while it is on).
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      className={cx(buttonStyles({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
