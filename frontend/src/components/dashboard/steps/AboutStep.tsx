'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { profileUpdateSchema } from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { TextArea } from '../../form-fields';
import { EditorForm } from '../EditorForm';
import { useEditor } from '../editor-context';
import { saveProfile } from '../save-profile';

const schema = profileUpdateSchema.pick({ about: true });
type Fields = { about: string };

export function AboutStep() {
  const { profile, update, setDraft, notify, takeFields } = useEditor();
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: { about: profile.about ?? '' },
  });

  useEffect(() => {
    const publish = (v: Partial<Fields>) => setDraft({ about: v.about || null });
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft]);

  // The summary read from an uploaded resume arrives as an unsaved edit, to review and fix.
  useEffect(() => {
    const { about } = takeFields(['about']);
    if (about) form.setValue('about', about, { shouldDirty: true });
  }, [form, takeFields]);

  async function onSubmit(values: z.output<typeof schema>) {
    const saved = await saveProfile(profile, values);
    update(() => saved);
    form.reset({ about: saved.about ?? '' });
    notify('success', 'Saved.');
  }

  return (
    <section aria-labelledby="about-heading" className="space-y-4">
      <h2 id="about-heading" className="text-lg font-semibold">
        About you
      </h2>
      <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save about">
        <TextArea
          name="about"
          label="About"
          rows={10}
          maxLength={5000}
          hint="A few paragraphs. A blank line starts a new paragraph. Up to 5000 characters."
        />
      </EditorForm>
    </section>
  );
}
