'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import type { Section } from '@portfolio/shared';
import { Button, Card, EmptyState, useConfirm } from '../ui';
import {
  errorText,
  useEditor,
  useSection,
  useSuggestions,
  type SectionItem,
  type SuggestionMap,
} from './editor-context';
import { SortableList } from './SortableList';

// Every list except skills (which are single words and have their own quick-add) can receive
// suggestions from a resume.
type ListSection = Exclude<Section, 'skills'>;
type Draft<S extends ListSection> = SuggestionMap[S];

// T is a saved item and D what a suggestion looks like (nothing, for lists without suggestions).
export interface FormProps<T, D = never> {
  item?: T; // set when editing a saved item
  draft?: D; // set when reviewing a suggestion from a resume
  onDone: () => void; // close the form (saved or cancelled)
  onSaved?: () => void; // called after a successful save, before onDone
}
export type ItemFormProps<S extends ListSection> = FormProps<SectionItem<S>, Draft<S>>;

interface ListApi<T> {
  items: T[];
  create: (input: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => void | Promise<void>;
}

interface Suggestions<D> {
  suggestions: { key: string; data: D }[];
  dismiss: (key: string) => void;
  dismissAll: () => void;
}

interface ListProps<T extends { id: string }, D> {
  list: ListApi<T>;
  suggestions?: Suggestions<D>;
  noun: string; // "job", used in messages
  addLabel: string;
  empty: string;
  limit?: number; // most items allowed; the Add button is replaced by a note when it is reached
  summary: (item: T | D) => { title: string; subtitle?: string };
  Form: ComponentType<FormProps<T, D>>;
  extra?: (item: T) => ReactNode; // extra controls in a row (link visibility)
}

const noSuggestions = { suggestions: [], dismiss: () => {}, dismissAll: () => {} };

// One list in the editor: rows with Edit and Delete, an Add button, and drag-to-reorder.
// Entries read from a resume appear above it as suggestions that can be edited and added, or
// skipped. The create/edit form is passed in, so every list shares this shell.
export function ListManager<T extends { id: string }, D = never>({
  list,
  suggestions: suggestionApi = noSuggestions,
  noun,
  addLabel,
  empty,
  limit,
  summary,
  Form,
  extra,
}: ListProps<T, D>) {
  const { items, create, remove, reorder } = list;
  const { suggestions, dismiss, dismissAll } = suggestionApi;
  const { notify } = useEditor();
  const confirm = useConfirm();
  // An item id, "new", "s:<suggestion key>", or nothing. One form at a time keeps unsaved
  // edits from being lost.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const sortable = items.length > 1;
  const full = limit !== undefined && items.length >= limit;
  const close = () => setEditing(null);
  const summarize = (item: T | D) => summary(item);

  async function onDelete(id: string) {
    const sure = await confirm({
      title: `Delete this ${noun}?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!sure) return;
    setDeleting(id);
    try {
      await remove(id);
      notify('success', `Deleted ${noun}.`);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setDeleting(null);
    }
  }

  // Adds suggestions as they are, one after another so their order is kept. Stops at the
  // first failure; whatever was added is already gone from the list.
  async function addSuggestions(chosen: typeof suggestions) {
    setAdding(true);
    try {
      for (const suggestion of chosen) {
        await create(suggestion.data);
        dismiss(suggestion.key);
      }
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setAdding(false);
    }
  }

  function row(item: T, handle?: ReactNode) {
    if (editing === item.id) {
      return (
        <Card tone="accent">
          <Form item={item} onDone={close} />
        </Card>
      );
    }
    const { title, subtitle } = summarize(item);
    return (
      <Card padding="sm" className="flex items-center gap-2">
        {handle}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {extra?.(item)}
        <Button
          variant="ghost"
          disabled={editing !== null}
          onClick={() => setEditing(item.id)}
          aria-label={`Edit ${title}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          disabled={deleting === item.id}
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${title}`}
        >
          {deleting === item.id ? 'Deleting…' : 'Delete'}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <Card
          as="section"
          tone="tint"
          dashed
          padding="sm"
          aria-label={`${noun} suggestions from your resume`}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">From your resume ({suggestions.length})</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                disabled={adding || editing !== null}
                onClick={() => addSuggestions(suggestions)}
              >
                {adding ? 'Adding…' : 'Add all'}
              </Button>
              <Button variant="ghost" disabled={adding} onClick={dismissAll}>
                Dismiss all
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion) => {
              const { title, subtitle } = summarize(suggestion.data);
              if (editing === `s:${suggestion.key}`) {
                return (
                  <Card as="li" key={suggestion.key} tone="accent">
                    <Form
                      draft={suggestion.data}
                      onDone={close}
                      onSaved={() => dismiss(suggestion.key)}
                    />
                  </Card>
                );
              }
              return (
                <Card
                  as="li"
                  key={suggestion.key}
                  padding="sm"
                  className="flex items-center gap-2 bg-page"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{title}</p>
                    {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                  </div>
                  <Button
                    disabled={adding || editing !== null}
                    onClick={() => setEditing(`s:${suggestion.key}`)}
                    aria-label={`Review and add ${title}`}
                  >
                    Review
                  </Button>
                  <Button
                    variant="primary"
                    disabled={adding || editing !== null}
                    onClick={() => addSuggestions([suggestion])}
                    aria-label={`Add ${title}`}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={adding}
                    onClick={() => dismiss(suggestion.key)}
                    aria-label={`Skip ${title}`}
                  >
                    Skip
                  </Button>
                </Card>
              );
            })}
          </ul>
        </Card>
      )}

      {items.length === 0 && editing !== 'new' && suggestions.length === 0 && (
        <EmptyState>{empty}</EmptyState>
      )}

      {sortable ? (
        <SortableList
          items={items}
          onReorder={reorder}
          label={(item) => summarize(item).title}
          renderItem={(item, handle) => row(item, editing === item.id ? undefined : handle)}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>{row(item)}</li>
          ))}
        </ul>
      )}

      {editing === 'new' ? (
        <Card tone="accent">
          <Form onDone={close} />
        </Card>
      ) : full ? (
        <p className="text-sm text-muted">
          You have reached the limit of {limit} {noun}s here. Delete one to add another.
        </p>
      ) : (
        <Button variant="primary" disabled={editing !== null} onClick={() => setEditing('new')}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

type SectionManagerProps<S extends ListSection> = { section: S } & Omit<
  ListProps<SectionItem<S>, Draft<S>>,
  'list' | 'suggestions' | 'limit'
>;

// ListManager for one of the built-in lists: its items, plus any suggestions from a resume.
export function SectionManager<S extends ListSection>({
  section,
  ...props
}: SectionManagerProps<S>) {
  const list = useSection(section);
  const suggestions = useSuggestions(section);
  return <ListManager list={list} suggestions={suggestions} {...props} />;
}
