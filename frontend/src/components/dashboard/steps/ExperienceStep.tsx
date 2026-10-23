'use client';

import { useForm } from 'react-hook-form';
import { experienceInputSchema, type ExperienceInput } from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { formatMonthYear } from '@/lib/format';
import { TextArea, TextField } from '../../form-fields';
import { DateRangeFields, toMonth, type DateRangeValues } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

type Fields = DateRangeValues & { title: string; company: string; description: string };

function ExperienceForm({ item, onDone }: ItemFormProps<'experience'>) {
  const { create, updateItem } = useSection('experience');
  const form = useForm<Fields, unknown, ExperienceInput>({
    resolver: schemaResolver(experienceInputSchema),
    defaultValues: {
      title: item?.title ?? '',
      company: item?.company ?? '',
      startDate: toMonth(item?.startDate),
      endDate: toMonth(item?.endDate),
      current: item ? !item.endDate : false,
      description: item?.description ?? '',
    },
  });

  async function onSubmit(values: ExperienceInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save job" onCancel={onDone}>
      <TextField name="title" label="Job title" />
      <TextField name="company" label="Company" />
      <DateRangeFields presentLabel="I currently work here" />
      <TextArea name="description" label="What you did" rows={5} maxLength={3000} />
    </EditorForm>
  );
}

export function ExperienceStep() {
  return (
    <section aria-labelledby="experience-heading" className="space-y-4">
      <div>
        <h2 id="experience-heading" className="text-lg font-semibold">
          Experience
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
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
          subtitle: `${formatMonthYear(job.startDate)} – ${job.endDate ? formatMonthYear(job.endDate) : 'Present'}`,
        })}
        Form={ExperienceForm}
      />
    </section>
  );
}
