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
import type { MyProfile, ParsedResume, PublicProfile, Section } from '@portfolio/shared';
import { ApiError, api } from '@/lib/client-api';

// Fields the live preview shows while they are still being typed (not yet saved).
export type Draft = Partial<
  Pick<MyProfile, 'fullName' | 'tagline' | 'location' | 'about' | 'theme'>
>;
type Notice = { kind: 'success' | 'error'; text: string };

// ---- Resume import. Nothing from a resume is saved until the person saves it. The profile
// fields are put into the Basics and About forms (unsaved); each list entry becomes a
// suggestion they can edit and add, or skip.
export interface SuggestionMap {
  links: ParsedResume['links'][number];
  skills: string;
  experience: ParsedResume['experience'][number];
  projects: ParsedResume['projects'][number];
  education: ParsedResume['education'][number];
}
export type SuggestionSection = keyof SuggestionMap;
export type Suggestion<K extends SuggestionSection> = { key: string; data: SuggestionMap[K] };
type Suggestions = { [K in SuggestionSection]: Suggestion<K>[] };
// Only the fields the resume actually had (never null), so each is a plain string.
export type ImportedFields = Partial<Record<'fullName' | 'tagline' | 'location' | 'about', string>>;
interface Imported {
  fields: ImportedFields; // waiting to be put into a form (taken once)
  suggestions: Suggestions;
  skipped: number; // entries the server could not read
}

const SUGGESTION_SECTIONS: SuggestionSection[] = [
  'links',
  'skills',
  'experience',
  'projects',
  'education',
];
const pendingCount = (imported: Imported | null) =>
  imported
    ? Object.keys(imported.fields).length +
      SUGGESTION_SECTIONS.reduce((n, k) => n + imported.suggestions[k].length, 0)
    : 0;

interface EditorContextValue {
  profile: MyProfile; // what is saved on the server
  preview: PublicProfile; // saved profile + draft, minus hidden links
  update: (change: (profile: MyProfile) => MyProfile) => void;
  setDraft: (draft: Draft | null) => void;
  notify: (kind: Notice['kind'], text: string) => void;
  markDirty: () => () => void;
  hasUnsaved: () => boolean;
  imported: Imported | null;
  hasPendingImport: boolean;
  applyImport: (resume: ParsedResume, skipped: number) => void;
  // Hands the imported values for these fields to a form, once.
  takeFields: (keys: (keyof ImportedFields)[]) => ImportedFields;
  dismissSuggestions: (section: SuggestionSection, keys: string[]) => void;
  discardImport: () => void;
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
  // The ref is read synchronously (a form takes its fields on mount); the state drives rendering.
  const [imported, setImportedState] = useState<Imported | null>(null);
  const importedRef = useRef<Imported | null>(null);
  const setImported = useCallback((next: Imported | null) => {
    importedRef.current = next;
    setImportedState(next);
  }, []);

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

  const applyImport = useCallback(
    (resume: ParsedResume, skipped: number) => {
      const fields: ImportedFields = {
        ...(resume.fullName && { fullName: resume.fullName }),
        ...(resume.tagline && { tagline: resume.tagline }),
        ...(resume.location && { location: resume.location }),
        ...(resume.about && { about: resume.about }),
      };
      const wrap = <K extends SuggestionSection>(list: SuggestionMap[K][]): Suggestion<K>[] =>
        list.map((data) => ({ key: crypto.randomUUID(), data }));
      setImported({
        fields,
        skipped,
        suggestions: {
          links: wrap<'links'>(resume.links),
          skills: wrap<'skills'>(resume.skills),
          experience: wrap<'experience'>(resume.experience),
          projects: wrap<'projects'>(resume.projects),
          education: wrap<'education'>(resume.education),
        },
      });
    },
    [setImported],
  );

  const takeFields = useCallback(
    (keys: (keyof ImportedFields)[]) => {
      const current = importedRef.current;
      const taken: ImportedFields = {};
      if (!current) return taken;
      const rest = { ...current.fields };
      for (const key of keys) {
        if (rest[key] !== undefined) {
          taken[key] = rest[key];
          delete rest[key];
        }
      }
      if (Object.keys(taken).length > 0) setImported({ ...current, fields: rest });
      return taken;
    },
    [setImported],
  );

  const dismissSuggestions = useCallback(
    (section: SuggestionSection, keys: string[]) => {
      const current = importedRef.current;
      if (!current) return;
      const remaining = (current.suggestions[section] as { key: string }[]).filter(
        (item) => !keys.includes(item.key),
      );
      setImported({ ...current, suggestions: { ...current.suggestions, [section]: remaining } });
    },
    [setImported],
  );

  const discardImport = useCallback(() => setImported(null), [setImported]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      // Also guards a parsed resume that has not been reviewed yet: it is not stored anywhere.
      if (dirtyForms.current > 0 || pendingCount(importedRef.current) > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const preview = useMemo<PublicProfile>(
    () => ({ ...profile, ...draft, links: profile.links.filter((link) => link.visible) }),
    [profile, draft],
  );

  const value = useMemo(
    () => ({
      profile,
      preview,
      update: setProfile,
      setDraft,
      notify,
      markDirty,
      hasUnsaved,
      imported,
      hasPendingImport: pendingCount(imported) > 0,
      applyImport,
      takeFields,
      dismissSuggestions,
      discardImport,
    }),
    [
      profile,
      preview,
      notify,
      markDirty,
      hasUnsaved,
      imported,
      applyImport,
      takeFields,
      dismissSuggestions,
      discardImport,
    ],
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

// The suggestions waiting for one list, with ways to clear them.
export function useSuggestions<K extends SuggestionSection>(section: K) {
  const { imported, dismissSuggestions } = useEditor();
  const suggestions = (imported?.suggestions[section] ?? []) as Suggestion<K>[];
  return {
    suggestions,
    dismiss: (key: string) => dismissSuggestions(section, [key]),
    dismissAll: () =>
      dismissSuggestions(
        section,
        suggestions.map((x) => x.key),
      ),
  };
}
