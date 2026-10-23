'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MyProfile, PublicProfile, Section } from '@portfolio/shared';
import { ApiError, api } from '@/lib/client-api';

// Fields the live preview shows while they are still being typed (not yet saved).
export type Draft = Partial<Pick<MyProfile, 'fullName' | 'tagline' | 'location' | 'about'>>;
type Notice = { kind: 'success' | 'error'; text: string };

interface EditorContextValue {
  profile: MyProfile; // what is saved on the server
  preview: PublicProfile; // saved profile + draft, minus hidden links
  update: (change: (profile: MyProfile) => MyProfile) => void;
  setDraft: (draft: Draft | null) => void;
  notify: (kind: Notice['kind'], text: string) => void;
  markDirty: () => () => void;
  hasUnsaved: () => boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditor must be used inside <EditorProvider>');
  return value;
}

export const errorText = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';

export function EditorProvider({ initial, children }: { initial: MyProfile; children: ReactNode }) {
  const [profile, setProfile] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirtyForms = useRef(0);

  const notify = useCallback((kind: Notice['kind'], text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  // Forms that hold unsaved edits register here; leaving the page or a step asks first.
  const markDirty = useCallback(() => {
    dirtyForms.current += 1;
    return () => {
      dirtyForms.current -= 1;
    };
  }, []);
  const hasUnsaved = useCallback(() => dirtyForms.current > 0, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyForms.current > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const preview = useMemo<PublicProfile>(
    () => ({ ...profile, ...draft, links: profile.links.filter((link) => link.visible) }),
    [profile, draft],
  );

  const value = useMemo(
    () => ({ profile, preview, update: setProfile, setDraft, notify, markDirty, hasUnsaved }),
    [profile, preview, notify, markDirty, hasUnsaved],
  );

  return (
    <EditorContext value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 lg:bottom-4 flex justify-center px-4"
      >
        {notice && (
          <p
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
              notice.kind === 'success'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-red-700 text-white'
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>
    </EditorContext>
  );
}

// Call from any form: while `isDirty` is true, leaving the step or page asks for confirmation.
export function useReportDirty(isDirty: boolean) {
  const { markDirty } = useEditor();
  useEffect(() => (isDirty ? markDirty() : undefined), [isDirty, markDirty]);
}

export type SectionItem<S extends Section> = MyProfile[S][number];

// Create, update, delete and reorder for one list. Each call hits the API first and only then
// changes the screen; reorder is optimistic (see below) because it follows a drag.
export function useSection<S extends Section>(section: S) {
  const { profile, update, notify } = useEditor();
  const items = profile[section] as SectionItem<S>[];
  const base = `/profile/me/${section}`;

  const replaceList = useCallback(
    (change: (list: SectionItem<S>[]) => SectionItem<S>[]) =>
      update((p) => ({ ...p, [section]: change(p[section] as SectionItem<S>[]) }) as MyProfile),
    [section, update],
  );

  const create = useCallback(
    async (input: unknown) => {
      const item = await api<SectionItem<S>>(base, { method: 'POST', body: input });
      replaceList((list) => [...list, item]);
    },
    [base, replaceList],
  );

  const updateItem = useCallback(
    async (id: string, input: unknown) => {
      const item = await api<SectionItem<S>>(`${base}/${id}`, { method: 'PUT', body: input });
      replaceList((list) => list.map((it) => (it.id === id ? item : it)));
    },
    [base, replaceList],
  );

  const remove = useCallback(
    async (id: string) => {
      await api(`${base}/${id}`, { method: 'DELETE' });
      replaceList((list) => list.filter((it) => it.id !== id));
    },
    [base, replaceList],
  );

  // Shows the new order at once and tells the server; if that fails, puts the old order back.
  const reorder = useCallback(
    async (ids: string[]) => {
      const before = items;
      replaceList((list) => ids.flatMap((id) => list.find((it) => it.id === id) ?? []));
      try {
        await api(`${base}/reorder`, { method: 'PATCH', body: { ids } });
      } catch (err) {
        replaceList(() => before);
        notify('error', `Couldn't save the new order. ${errorText(err)}`);
      }
    },
    [base, items, notify, replaceList],
  );

  return { items, create, updateItem, remove, reorder };
}
