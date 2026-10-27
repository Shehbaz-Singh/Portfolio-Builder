import { cx } from './cx';

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
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60',
        checked ? 'bg-accent' : 'bg-line',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-page transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}
