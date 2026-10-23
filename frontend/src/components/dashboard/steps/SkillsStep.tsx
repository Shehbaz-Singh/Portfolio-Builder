'use client';

import { useForm } from 'react-hook-form';
import { skillInputSchema, type SkillInput } from '@portfolio/shared';
import { schemaResolver, showApiError } from '@/lib/form';
import { Button, ErrorText, SlowNotice, inputClass } from '../../ui';
import { errorText, useEditor, useSection } from '../editor-context';
import { SortableList } from '../SortableList';

export function SkillsStep() {
  const { items, create, remove, reorder } = useSection('skills');
  const { notify } = useEditor();
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
