import { cx } from './cx';

export type ToastData = { kind: 'success' | 'error'; text: string };

// A short message that appears, is announced, and goes. The region is always in the page (empty),
// because screen readers only announce changes inside a live region that already exists.
export function ToastRegion({ toast }: { toast: ToastData | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-4"
    >
      {toast && (
        <p
          className={cx(
            'rounded-control px-4 py-2 text-sm font-medium shadow-overlay',
            toast.kind === 'success' ? 'bg-ink text-page' : 'bg-danger text-page',
          )}
        >
          {toast.text}
        </p>
      )}
    </div>
  );
}
