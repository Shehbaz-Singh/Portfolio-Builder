'use client';

import { useForm } from 'react-hook-form';
import { projectInputSchema, type ProjectInput } from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { TextArea, TextField } from '../../form-fields';
import { EditorForm } from '../EditorForm';
import { useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';

// Tags are typed as "Go, Rust, SQL" and sent as a list.
type Fields = { name: string; url: string; description: string; techTags: string };
const splitTags = (text: string) =>
  text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

function ProjectForm({ item, onDone }: ItemFormProps<'projects'>) {
  const { create, updateItem } = useSection('projects');
  const form = useForm<Fields, unknown, ProjectInput>({
    resolver: schemaResolver(projectInputSchema, (v: Fields) => ({
      ...v,
      techTags: splitTags(v.techTags),
    })),
    defaultValues: {
      name: item?.name ?? '',
      url: item?.url ?? '',
      description: item?.description ?? '',
      techTags: item?.techTags.join(', ') ?? '',
    },
  });

  async function onSubmit(values: ProjectInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save project" onCancel={onDone}>
      <TextField name="name" label="Project name" />
      <TextField
        name="url"
        label="Link"
        placeholder="https://"
        hint="Optional. Makes the project card clickable."
        autoCapitalize="none"
        spellCheck={false}
      />
      <TextArea name="description" label="Description" rows={4} maxLength={3000} />
      <TextField
        name="techTags"
        label="Technologies"
        placeholder="React, Node.js, PostgreSQL"
        hint="Separate with commas. Up to 20."
      />
    </EditorForm>
  );
}

export function ProjectsStep() {
  return (
    <section aria-labelledby="projects-heading" className="space-y-4">
      <div>
        <h2 id="projects-heading" className="text-lg font-semibold">
          Projects
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Shown in this order on your page. Drag the grip to reorder.
        </p>
      </div>
      <SectionManager
        section="projects"
        noun="project"
        addLabel="Add a project"
        empty="No projects added yet."
        summary={(project) => ({
          title: project.name,
          subtitle: project.techTags.join(', ') || undefined,
        })}
        Form={ProjectForm}
      />
    </section>
  );
}
