import { X } from 'lucide-react';
import { cx } from './cx';

export type ToastData = { id: number; kind: 'success' | 'error'; text: string };

// Short messages that appear, are announced, and go; each can also be closed by hand. The region is
// always in the page (empty), because screen readers only announce changes inside a live region
// that already exists. It sits above the mobile bottom navigation.
export function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-4"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className={cx(
            'pointer-events-auto flex max-w-md items-start gap-3 rounded-control py-2 ps-4 pe-2 text-sm font-medium shadow-overlay',
            toast.kind === 'success' ? 'bg-ink text-page' : 'bg-danger text-page',
          )}
        >
          <span className="min-w-0 py-0.5">{toast.text}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss message"
            className="shrink-0 rounded p-1 hover:bg-white/20"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </p>
      ))}
    </div>
  );
}
