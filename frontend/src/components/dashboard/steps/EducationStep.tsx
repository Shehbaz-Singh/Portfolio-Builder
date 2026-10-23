'use client';

import { useForm } from 'react-hook-form';
import { educationInputSchema, type EducationInput } from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { formatMonthYear } from '@/lib/format';
import { TextField } from '../../form-fields';
import { DateRangeFields, toMonth, type DateRangeValues } from '../DateRangeFields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

type Fields = DateRangeValues & { degree: string; institution: string };

function EducationForm({ item, onDone }: ItemFormProps<'education'>) {
  const { create, updateItem } = useSection('education');
  const form = useForm<Fields, unknown, EducationInput>({
    resolver: schemaResolver(educationInputSchema),
    defaultValues: {
      degree: item?.degree ?? '',
      institution: item?.institution ?? '',
      startDate: toMonth(item?.startDate),
      endDate: toMonth(item?.endDate),
      current: item ? !item.endDate : false,
    },
  });

  async function onSubmit(values: EducationInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save education" onCancel={onDone}>
      <TextField name="degree" label="Degree or course" />
      <TextField name="institution" label="School or university" />
      <DateRangeFields presentLabel="I am still studying here" />
    </EditorForm>
  );
}

export function EducationStep() {
  return (
    <section aria-labelledby="education-heading" className="space-y-4">
      <div>
        <h2 id="education-heading" className="text-lg font-semibold">
          Education
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Shown in this order on your page. Drag the grip to reorder.
        </p>
      </div>
      <SectionManager
        section="education"
        noun="entry"
        addLabel="Add education"
        empty="No education added yet."
        summary={(entry) => ({
          title: entry.degree,
          subtitle: `${entry.institution} · ${formatMonthYear(entry.startDate)} – ${entry.endDate ? formatMonthYear(entry.endDate) : 'Present'}`,
        })}
        Form={EducationForm}
      />
    </section>
  );
}
