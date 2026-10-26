'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { skillInputSchema, type SkillInput } from '@portfolio/shared';
import { schemaResolver, showApiError } from '@/lib/form';
import { Button, ErrorText, SlowNotice, inputClass } from '../../ui';
import {
  errorText,
  useEditor,
  useSection,
  useSuggestions,
  type Suggestion,
} from '../editor-context';
import { SortableList } from '../SortableList';

export function SkillsStep() {
  const { items, create, remove, reorder } = useSection('skills');
  const { notify } = useEditor();
  const { suggestions, dismiss, dismissAll } = useSuggestions('skills');
  const [adding, setAdding] = useState(false);
  const form = useForm<{ name: string }, unknown, SkillInput>({
    resolver: schemaResolver(skillInputSchema),
    defaultValues: { name: '' },
  });
  const { errors, isSubmitting } = form.formState;

  // Skills are single words, so adding is one field and Enter, not a form per skill.
  const add = form.handleSubmit(async (values) => {
    try {
      await create(values);
      form.reset();
    } catch (err) {
      showApiError(form, err);
    }
  });

  // Adds suggested skills one after another so their order is kept; each leaves the list once added.
  async function addSuggested(list: Suggestion<'skills'>[]) {
    setAdding(true);
    try {
      for (const suggestion of list) {
        await create({ name: suggestion.data });
        dismiss(suggestion.key);
      }
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <section aria-labelledby="skills-heading" className="space-y-4">
      <div>
        <h2 id="skills-heading" className="text-lg font-semibold">
          Skills
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Drag the grip to reorder, or focus it and use the arrow keys.
        </p>
      </div>

      <form onSubmit={add} noValidate className="flex gap-2">
        <input
          aria-label="New skill"
          placeholder="Add a skill, e.g. TypeScript"
          autoComplete="off"
          className={inputClass}
          aria-invalid={errors.name ? true : undefined}
          {...form.register('name')}
        />
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Add
        </Button>
      </form>
      <ErrorText>{errors.name?.message ?? errors.root?.server?.message}</ErrorText>
      <SlowNotice pending={isSubmitting} />

      {suggestions.length > 0 && (
        <section
          aria-label="Skill suggestions from your resume"
          className="space-y-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">From your resume ({suggestions.length})</p>
            <div className="flex gap-2">
              <Button variant="primary" disabled={adding} onClick={() => addSuggested(suggestions)}>
                {adding ? 'Adding…' : 'Add all'}
              </Button>
              <Button variant="ghost" disabled={adding} onClick={dismissAll}>
                Dismiss all
              </Button>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.key}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <button
                  type="button"
                  aria-label={`Add ${suggestion.data}`}
                  disabled={adding}
                  className="rounded-l-full py-1 pr-2 pl-3 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:hover:bg-slate-800"
                  onClick={() => addSuggested([suggestion])}
                >
                  + {suggestion.data}
                </button>
                <button
                  type="button"
                  aria-label={`Skip ${suggestion.data}`}
                  disabled={adding}
                  className="rounded-r-full px-2 py-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:hover:bg-slate-800"
                  onClick={() => dismiss(suggestion.key)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">No skills yet.</p>
      ) : (
        <SortableList
          items={items}
          layout="wrap"
          onReorder={reorder}
          label={(skill) => skill.name}
          renderItem={(skill, handle) => (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1 pl-1.5 text-sm dark:bg-slate-800">
              {handle}
              {skill.name}
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                className="rounded-full px-2 text-slate-500 hover:bg-slate-200 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-slate-700"
                onClick={() => remove(skill.id).catch((err) => notify('error', errorText(err)))}
              >
                ×
              </button>
            </span>
          )}
        />
      )}
    </section>
  );
}
