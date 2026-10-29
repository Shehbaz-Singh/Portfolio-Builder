'use client';

import {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Search } from 'lucide-react';
import { buttonStyles } from '../../ui';
import { isMacPlatform, useIsMac } from './platform';

// The command palette's shell: the keyboard shortcut, the state of open or closed, and the button for
// the top bar. It is small on purpose. The palette itself (the command list, the search, the dialog)
// is a separate chunk, fetched the first time it is opened.
const CommandPalette = lazy(() => import('./CommandPalette'));

interface PaletteApi {
  open: () => void;
}
const PaletteContext = createContext<PaletteApi | null>(null);

// Where a key press happened that the palette must leave alone: the Markdown editor and rich text
// fields have their own Ctrl+K (inserting a link). Mark such a field with data-mod-k-own.
const OWN_SHORTCUT =
  '[data-mod-k-own], [contenteditable=""], [contenteditable="true"], .ProseMirror, .cm-editor';

export function PaletteProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false); // true from the first opening: the chunk is then kept

  const show = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLoaded(true);
    setOpen(true);
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  // Mounted only in the dashboard, so this listener does not exist on any public page. The browser
  // keeps Ctrl+K for itself (the address bar) unless the key press is ours to take: only when focus is
  // in the dashboard, and not inside a field that uses the shortcut itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || e.altKey || e.shiftKey || e.defaultPrevented) return;
      // Cmd+K on a Mac, Ctrl+K elsewhere. (Ctrl+K on a Mac is "delete to end of line" in text fields.)
      const mac = isMacPlatform();
      if (mac ? !e.metaKey || e.ctrlKey : !e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(OWN_SHORTCUT)) return;
      const inDashboard =
        !target ||
        target === document.body ||
        target === document.documentElement ||
        root.current?.contains(target) === true;
      if (!inDashboard) return;
      e.preventDefault();
      if (open) hide();
      else show();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, show, hide]);

  const api = useMemo(() => ({ open: show }), [show]);

  return (
    <PaletteContext value={api}>
      {/* display: contents: only here to know what is "inside the dashboard". */}
      <div ref={root} className="contents">
        {children}
        {loaded && open && (
          <Suspense fallback={null}>
            <CommandPalette opener={opener} onClose={hide} />
          </Suspense>
        )}
      </div>
    </PaletteContext>
  );
}

// The visible way in, for phones and for anyone who does not know the shortcut.
export function PaletteButton() {
  const palette = useContext(PaletteContext);
  const mac = useIsMac();
  if (!palette) return null;
  return (
    <button
      type="button"
      onClick={palette.open}
      aria-haspopup="dialog"
      aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}
      className={buttonStyles({ size: 'sm' })}
    >
      <Search aria-hidden="true" className="size-4" />
      <span>Search or jump to…</span>
      <kbd
        aria-hidden="true"
        className="ms-1 rounded-sm border border-line bg-surface px-1.5 font-sans text-xs text-muted max-sm:hidden"
      >
        {mac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}
