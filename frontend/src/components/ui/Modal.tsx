'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from './Button';

// A dialog on the browser's own <dialog>: the page behind it is inert, Tab stays inside, Escape
// closes it, and focus goes back to what opened it. Clicking outside closes it too.
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  footer?: ReactNode; // the buttons; the first focusable one gets the focus
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Focus goes back to what opened the dialog. The browser does this itself on close(), but not
    // once React has already taken the dialog out of the page, so it is done here.
    const opener = document.activeElement as HTMLElement | null;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (open) opener?.focus();
    };
  }, [open]);

  return (
    // Escape is handled by onCancel below. The click is only a mouse shortcut for
    // closing: it is not the way to close it, so no keyboard handler is needed.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // `cancel` fires only when the person presses Escape. (`close` also fires when the code closes
      // the dialog, which would count as a dismissal.) The parent closes it by setting open=false.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-page p-0 text-ink shadow-overlay backdrop:bg-black/40"
    >
      <div className="space-y-4 p-card-lg">
        <h2 id={titleId} className="type-section">
          {title}
        </h2>
        {description && (
          <div id={descriptionId} className="text-sm text-muted">
            {description}
          </div>
        )}
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div>}
      </div>
    </dialog>
  );
}

// ---- confirm(): a question with Cancel and a confirm button, as a promise. It replaces the
// browser's window.confirm, so the question looks like the app and can be styled and read out.

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // the confirm button looks destructive
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (answer: boolean) => void;
  } | null>(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setPending({ options, resolve })),
    [],
  );

  const answer = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      {pending && (
        <Modal
          open
          onClose={() => answer(false)}
          title={pending.options.title}
          description={pending.options.message}
          footer={
            <>
              <Button onClick={() => answer(false)}>
                {pending.options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={pending.options.danger ? 'danger' : 'primary'}
                onClick={() => answer(true)}
              >
                {pending.options.confirmLabel ?? 'OK'}
              </Button>
            </>
          }
        />
      )}
    </ConfirmContext>
  );
}
