'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import type { Section } from '@portfolio/shared';
import { Button } from '../ui';
import { errorText, useEditor, useSection, type SectionItem } from './editor-context';
import { SortableList } from './SortableList';

export interface ItemFormProps<S extends Section> {
  item?: SectionItem<S>; // absent when adding
  onDone: () => void;
}

interface Props<S extends Section> {
  section: S;
  noun: string; // "job", used in messages
  addLabel: string;
  empty: string;
  summary: (item: SectionItem<S>) => { title: string; subtitle?: string };
  Form: ComponentType<ItemFormProps<S>>;
  extra?: (item: SectionItem<S>) => ReactNode; // extra controls in a row (link visibility)
}

// One list in the editor: rows with Edit and Delete, an Add button, and drag-to-reorder where
// the API supports it. The create/edit form is passed in, so every section shares this shell.
export function SectionManager<S extends Section>({
  section,
  noun,
  addLabel,
  empty,
  summary,
  Form,
  extra,
}: Props<S>) {
  const { items, remove, reorder } = useSection(section);
  const { notify } = useEditor();
  // An item id, "new", or nothing. One form at a time keeps unsaved edits from being lost.
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const sortable = items.length > 1;
  const close = () => setEditing(null);

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

  function row(item: SectionItem<S>, handle?: ReactNode) {
    if (editing === item.id) {
      return (
        <div className="rounded-xl border border-indigo-300 p-4 dark:border-indigo-700">
          <Form item={item} onDone={close} />
        </div>
      );
    }
    const { title, subtitle } = summary(item);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        {handle}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          {subtitle && (
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
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
      {items.length === 0 && editing !== 'new' && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{empty}</p>
      )}

      {sortable ? (
        <SortableList
          items={items}
          onReorder={reorder}
          label={(item) => summary(item).title}
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
        <div className="rounded-xl border border-indigo-300 p-4 dark:border-indigo-700">
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
