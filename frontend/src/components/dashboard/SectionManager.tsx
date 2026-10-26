'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import type { Section } from '@portfolio/shared';
import { Button } from '../ui';
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

export interface ItemFormProps<S extends ListSection> {
  item?: SectionItem<S>; // set when editing a saved item
  draft?: Draft<S>; // set when reviewing a suggestion from a resume
  onDone: () => void; // close the form (saved or cancelled)
  onSaved?: () => void; // called after a successful save, before onDone
}

interface Props<S extends ListSection> {
  section: S;
  noun: string; // "job", used in messages
  addLabel: string;
  empty: string;
  summary: (item: Draft<S>) => { title: string; subtitle?: string };
  Form: ComponentType<ItemFormProps<S>>;
  extra?: (item: SectionItem<S>) => ReactNode; // extra controls in a row (link visibility)
}

const cardClass = 'rounded-xl border border-accent/50 p-4';

// One list in the editor: rows with Edit and Delete, an Add button, and drag-to-reorder.
// Entries read from a resume appear above it as suggestions that can be edited and added, or
// skipped. The create/edit form is passed in, so every section shares this shell.
export function SectionManager<S extends ListSection>({
  section,
  noun,
  addLabel,
  empty,
  summary,
  Form,
  extra,
}: Props<S>) {
  const { items, create, remove, reorder } = useSection(section);
  const { suggestions, dismiss, dismissAll } = useSuggestions(section);
  const { notify } = useEditor();
  // An item id, "new", "s:<suggestion key>", or nothing. One form at a time keeps unsaved
  // edits from being lost.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const sortable = items.length > 1;
  const close = () => setEditing(null);
  const summarize = (item: SectionItem<S> | Draft<S>) => summary(item as Draft<S>);

  async function onDelete(id: string) {
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await remove(id);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setDeleting(null);
    }
  }

  // Adds suggestions as they are, one after another so their order is kept. Stops at the
  // first failure; whatever was added is already gone from the list.
  async function addSuggestions(list: typeof suggestions) {
    setAdding(true);
    try {
      for (const suggestion of list) {
        await create(suggestion.data);
        dismiss(suggestion.key);
      }
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setAdding(false);
    }
  }

  function row(item: SectionItem<S>, handle?: ReactNode) {
    if (editing === item.id) {
      return (
        <div className={cardClass}>
          <Form item={item} onDone={close} />
        </div>
      );
    }
    const { title, subtitle } = summarize(item);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line p-3">
        {handle}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.length > 0 && (
        <section
          aria-label={`${noun} suggestions from your resume`}
          className="space-y-3 rounded-2xl border border-dashed border-accent/50 bg-accent-soft p-3"
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
                  <li key={suggestion.key} className={cardClass}>
                    <Form
                      draft={suggestion.data}
                      onDone={close}
                      onSaved={() => dismiss(suggestion.key)}
                    />
                  </li>
                );
              }
              return (
                <li
                  key={suggestion.key}
                  className="flex items-center gap-2 rounded-xl border border-line bg-page p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{title}</p>
                    {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
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
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {items.length === 0 && editing !== 'new' && suggestions.length === 0 && (
        <p className="text-sm text-muted">{empty}</p>
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
        <div className={cardClass}>
          <Form onDone={close} />
        </div>
      ) : (
        <Button variant="primary" disabled={editing !== null} onClick={() => setEditing('new')}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
