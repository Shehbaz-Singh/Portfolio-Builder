'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

interface Props {
  url: string; // the canonical profile URL
  title: string;
  // pill: filled with the accent color (public page); outline: a plain button (dashboard);
  // inverse: for use on an accent-colored background, where an accent button would vanish
  variant?: 'pill' | 'outline' | 'inverse';
}

const noSubscription = () => () => {};
// Read on the client only: the server cannot know, so it renders the menu version first.
const hasWebShare = () => typeof navigator.share === 'function';

const itemClass =
  'block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';

// Share button. Where the device has the Web Share API it opens the system share sheet;
// otherwise it opens a small menu (copy link, LinkedIn, X, WhatsApp, email). The menu is a
// disclosure: Escape closes it and returns focus to the button, as does tabbing out of it.
export function ShareButton({ url, title, variant = 'pill' }: Props) {
  const native = useSyncExternalStore(noSubscription, hasWebShare, () => false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  // The menu hangs from the button's left edge; near the right edge of a small screen it is
  // flipped to hang from the right edge instead, so it never runs off the screen.
  const [alignEnd, setAlignEnd] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const menuId = useId();

  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    if (!open) return setAlignEnd(false);
    const box = menu.current?.getBoundingClientRect();
    if (box && box.right > document.documentElement.clientWidth - 8) setAlignEnd(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('a, button')?.focus();

    const close = (refocus: boolean) => {
      setOpen(false);
      if (refocus) trigger.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true);
    const onPointer = (e: PointerEvent) =>
      !root.current?.contains(e.target as Node) && close(false);
    const onFocus = (e: FocusEvent) => !root.current?.contains(e.target as Node) && close(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open]);

  function announce(text: string) {
    clearTimeout(timer.current);
    setStatus(text);
    timer.current = setTimeout(() => setStatus(''), 2500);
  }

  async function onTrigger() {
    if (!native) return setOpen((o) => !o);
    try {
      await navigator.share({ title, url });
    } catch (err) {
      // Cancelling the share sheet is not an error; anything else falls back to the menu.
      if (!(err instanceof DOMException && err.name === 'AbortError')) setOpen(true);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      announce('Link copied');
    } catch {
      announce('Could not copy the link');
    }
    setOpen(false);
    trigger.current?.focus();
  }

  // Up and Down arrows move between the menu items.
  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('a, button')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const targets = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'X', href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'Email', href: `mailto:?subject=${t}&body=${u}`, external: false },
  ];

  const look = {
    pill: 'rounded-full bg-accent px-4 py-2 text-on-accent hover:bg-accent/90 focus-visible:outline-accent',
    outline:
      'rounded-lg border border-line px-4 py-2 hover:bg-surface focus-visible:outline-accent',
    inverse:
      'rounded-full bg-on-accent px-4 py-2 text-accent hover:opacity-90 focus-visible:outline-on-accent',
  }[variant];

  return (
    <div ref={root} className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        onClick={onTrigger}
        aria-expanded={native ? undefined : open}
        aria-controls={native ? undefined : menuId}
        className={`inline-flex items-center gap-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 ${look}`}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
          <path d="M13 4.5a2.5 2.5 0 1 1 .7 1.74L7.9 9.2a2.5 2.5 0 0 1 0 1.6l5.8 2.96a2.5 2.5 0 1 1-.7 1.38l-5.8-2.97a2.5 2.5 0 1 1 0-4.34l5.8-2.97A2.5 2.5 0 0 1 13 4.5Z" />
        </svg>
        Share
      </button>

      {open && (
        <ul
          ref={menu}
          id={menuId}
          onKeyDown={onMenuKey}
          className={`absolute top-full z-20 mt-2 w-48 rounded-xl border border-line bg-page p-1 text-ink shadow-lg ${alignEnd ? 'end-0' : 'start-0'}`}
        >
          <li>
            <button type="button" onClick={copy} className={itemClass}>
              Copy link
            </button>
          </li>
          {targets.map(({ label, href, external = true }) => (
            <li key={label}>
              <a
                href={href}
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                {label}
                {external && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Always in the page so screen readers pick up the text when it appears. */}
      <span
        role="status"
        aria-live="polite"
        className={
          status
            ? 'absolute start-0 top-full z-10 mt-2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-page'
            : 'sr-only'
        }
      >
        {status}
      </span>
    </div>
  );
}
