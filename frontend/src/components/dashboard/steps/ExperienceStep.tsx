'use client';

import { useForm } from 'react-hook-form';
import { experienceInputSchema, type ExperienceInput } from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { formatRange } from '@/lib/format';
import { TextArea, TextField } from '../../form-fields';
import { DateRangeFields, toMonth, type DateRangeValues } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

type Fields = DateRangeValues & { title: string; company: string; description: string };

function ExperienceForm({ item, draft, onDone, onSaved }: ItemFormProps<'experience'>) {
  const { create, updateItem } = useSection('experience');
  const source = item ?? draft; // a saved item, or a suggestion from a resume
  const form = useForm<Fields, unknown, ExperienceInput>({
    resolver: schemaResolver(experienceInputSchema),
    defaultValues: {
      title: source?.title ?? '',
      company: source?.company ?? '',
      startDate: toMonth(source?.startDate),
      endDate: toMonth(source?.endDate),
      current: source ? !source.endDate : false,
      description: source?.description ?? '',
    },
  });

  async function onSubmit(values: ExperienceInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save job" onCancel={onDone}>
      <TextField name="title" label="Job title" required />
      <TextField name="company" label="Company" required />
      <DateRangeFields presentLabel="I currently work here" />
      <TextArea name="description" label="What you did" rows={5} maxLength={3000} />
    </EditorForm>
  );
}

export function ExperienceStep() {
  return (
    <section aria-labelledby="experience-heading" className="space-y-4">
      <div>
        <h2 id="experience-heading" className="type-section">
          Experience
        </h2>
        <p className="text-sm text-muted">
          Shown in this order on your page. Drag the grip to reorder.
        </p>
      </div>
      <SectionManager
        section="experience"
        noun="job"
        addLabel="Add a job"
        empty="No experience added yet."
        summary={(job) => ({
          title: `${job.title} at ${job.company}`,
          subtitle: `${formatRange(job.startDate, job.endDate)}`,
        })}
        Form={ExperienceForm}
      />
    </section>
  );
}
