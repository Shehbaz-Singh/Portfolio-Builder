'use client';

import { createContext, useContext, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  CUSTOM_DESCRIPTION_MAX,
  CUSTOM_SUBTITLE_MAX,
  CUSTOM_TITLE_MAX,
  MAX_CUSTOM_ITEMS,
  MAX_CUSTOM_SECTIONS,
  customItemInputSchema,
  customSectionInputSchema,
  type CustomItemInput,
  type MyCustomSection,
} from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { formatMonthYear } from '@/lib/format';
import { TextArea, TextField } from '../../form-fields';
import { Button, ErrorText, inputClass } from '../../ui';
import { toMonth } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { ListManager, type FormProps } from '../SectionManager';
import {
  errorText,
  useCustomItems,
  useCustomSections,
  useEditor,
  type CustomItem,
} from '../editor-context';

// Starting points for "Add section". The title is filled in and can be changed before creating.
const PRESETS = ['Certifications', 'Awards', 'Publications', 'Volunteering'];

// ---- items

// The item form belongs to one section; the section's card provides its id.
const SectionIdContext = createContext('');

type ItemFields = {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  url: string;
  description: string;
};

function CustomItemForm({ item, onDone, onSaved }: FormProps<CustomItem>) {
  const { create, updateItem } = useCustomItems(useContext(SectionIdContext));
  const form = useForm<ItemFields, unknown, CustomItemInput>({
    resolver: schemaResolver(customItemInputSchema),
    defaultValues: {
      title: item?.title ?? '',
      subtitle: item?.subtitle ?? '',
      startDate: toMonth(item?.startDate),
      endDate: toMonth(item?.endDate),
      url: item?.url ?? '',
      description: item?.description ?? '',
    },
  });

  async function onSubmit(values: CustomItemInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save item" onCancel={onDone}>
      <TextField name="title" label="Title" maxLength={CUSTOM_TITLE_MAX} />
      <TextField
        name="subtitle"
        label="Subtitle (optional)"
        hint="For example the issuer, organisation or publisher."
        maxLength={CUSTOM_SUBTITLE_MAX}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="startDate" label="Date or start (optional)" type="month" />
        <TextField name="endDate" label="End (optional)" type="month" />
      </div>
      <TextField
        name="url"
        label="Link (optional)"
        type="url"
        placeholder="https://"
        hint="Must start with http:// or https://"
      />
      <TextArea
        name="description"
        label="Description (optional)"
        rows={4}
        maxLength={CUSTOM_DESCRIPTION_MAX}
        hint="Plain text. Up to 1000 characters."
      />
    </EditorForm>
  );
}

const summarizeItem = (item: CustomItem) => {
  const dates = item.startDate
    ? item.endDate
      ? `${formatMonthYear(item.startDate)} – ${formatMonthYear(item.endDate)}`
      : formatMonthYear(item.startDate)
    : null;
  return {
    title: item.title,
    subtitle: [item.subtitle, dates].filter(Boolean).join(' · ') || undefined,
  };
};

// ---- one section

// Renaming is a small inline form; the title rules are the shared schema's.
function RenameForm({ section, onDone }: { section: MyCustomSection; onDone: () => void }) {
  const { rename } = useCustomSections();
  const { notify } = useEditor();
  const [title, setTitle] = useState(section.title);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = customSectionInputSchema.safeParse({ title });
    if (!parsed.success) return setError('Enter a title (up to 80 characters).');
    setSaving(true);
    try {
      await rename(section.id, parsed.data.title);
      notify('success', 'Saved.');
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
      <div className="min-w-48 flex-1">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Section title"
          aria-invalid={error ? true : undefined}
          maxLength={CUSTOM_TITLE_MAX}
          autoFocus
          className={inputClass}
        />
        <ErrorText>{error}</ErrorText>
      </div>
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save title'}
      </Button>
      <Button variant="ghost" onClick={onDone} disabled={saving}>
        Cancel
      </Button>
    </form>
  );
}

function CustomSectionCard({ section }: { section: MyCustomSection }) {
  const { remove } = useCustomSections();
  const { notify } = useEditor();
  const list = useCustomItems(section.id);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    const count = section.items.length;
    const items = count ? ` and its ${count} item${count === 1 ? '' : 's'}` : '';
    if (!window.confirm(`Delete "${section.title}"${items}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await remove(section.id);
      notify('success', 'Section deleted.');
    } catch (err) {
      notify('error', errorText(err));
      setDeleting(false);
    }
  }

  return (
    <SectionIdContext value={section.id}>
      <article
        aria-labelledby={`custom-title-${section.id}`}
        className="space-y-4 rounded-2xl border border-line p-4"
      >
        <header className="flex flex-wrap items-center gap-2">
          {renaming ? (
            <RenameForm section={section} onDone={() => setRenaming(false)} />
          ) : (
            <>
              <h3
                id={`custom-title-${section.id}`}
                className="min-w-0 text-base font-semibold break-words"
              >
                {section.title}
              </h3>
              <span className="text-sm text-muted">
                {section.items.length} of {MAX_CUSTOM_ITEMS} items
              </span>
              <div className="ms-auto flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setRenaming(true)}
                  aria-label={`Rename ${section.title}`}
                >
                  Rename
                </Button>
                <Button
                  variant="danger"
                  disabled={deleting}
                  onClick={onDelete}
                  aria-label={`Delete section ${section.title}`}
                >
                  {deleting ? 'Deleting…' : 'Delete section'}
                </Button>
              </div>
            </>
          )}
        </header>

        <ListManager
          list={list}
          noun="item"
          addLabel="Add an item"
          empty="No items yet. A section with no items is not shown on your page."
          limit={MAX_CUSTOM_ITEMS}
          summary={summarizeItem}
          Form={CustomItemForm}
        />
      </article>
    </SectionIdContext>
  );
}

// ---- adding a section

// "Add section" offers the presets and a blank section. Picking one opens a small form with the
// title filled in (or empty), so it can be changed before the section is created.
function AddSection({ count }: { count: number }) {
  const { create } = useCustomSections();
  const { notify } = useEditor();
  const [choosing, setChoosing] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  if (count >= MAX_CUSTOM_SECTIONS) {
    return (
      <p className="text-sm text-muted">
        You have reached the limit of {MAX_CUSTOM_SECTIONS} custom sections. Delete one to add
        another.
      </p>
    );
  }

  const start = (initial: string) => {
    setChoosing(false);
    setError(undefined);
    setTitle(initial);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = customSectionInputSchema.safeParse({ title });
    if (!parsed.success) return setError('Enter a title (up to 80 characters).');
    setSaving(true);
    try {
      await create(parsed.data.title);
      notify('success', 'Section added. Add items to it, and it appears on your page.');
      setTitle(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  if (title !== null) {
    return (
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-accent/50 p-4">
        <div>
          <label htmlFor="new-section-title" className="mb-1 block text-sm font-medium">
            Section title
          </label>
          <input
            id="new-section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={CUSTOM_TITLE_MAX}
            aria-invalid={error ? true : undefined}
            autoFocus
            className={inputClass}
          />
          <ErrorText>{error}</ErrorText>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create section'}
          </Button>
          <Button variant="ghost" onClick={() => setTitle(null)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (choosing) {
    return (
      <div role="group" aria-label="Start from" className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Start from:</span>
        {PRESETS.map((preset) => (
          <Button key={preset} onClick={() => start(preset)}>
            {preset}
          </Button>
        ))}
        <Button onClick={() => start('')}>Blank section</Button>
        <Button variant="ghost" onClick={() => setChoosing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" onClick={() => setChoosing(true)}>
      Add section
    </Button>
  );
}

// ---- the step

export function CustomSectionsStep() {
  const { sections } = useCustomSections();

  return (
    <section aria-labelledby="custom-heading" className="space-y-4">
      <div>
        <h2 id="custom-heading" className="text-lg font-semibold">
          Custom sections
        </h2>
        <p className="text-sm text-muted">
          Add your own sections, such as Certifications or Awards. They join the list under
          Sections, where you can reorder or hide them. Up to {MAX_CUSTOM_SECTIONS} sections with{' '}
          {MAX_CUSTOM_ITEMS} items each. A section with no items is not shown.
        </p>
      </div>

      {sections.length === 0 && <p className="text-sm text-muted">No custom sections yet.</p>}
      {sections.map((section) => (
        <CustomSectionCard key={section.id} section={section} />
      ))}

      <AddSection count={sections.length} />
    </section>
  );
}
