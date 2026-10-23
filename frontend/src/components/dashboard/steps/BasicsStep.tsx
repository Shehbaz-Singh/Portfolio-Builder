'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import {
  linkInputSchema,
  linkTypeSchema,
  profileUpdateSchema,
  slugSchema,
  type LinkInput,
  type LinkType,
  type MyLink,
  type MyProfile,
} from '@portfolio/shared';
import { ApiError, api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { initials } from '@/lib/format';
import { CheckboxField, SelectField, TextField } from '../../form-fields';
import { Button, SlowNotice } from '../../ui';
import { EditorForm } from '../EditorForm';
import { errorText, useEditor, useSection } from '../editor-context';
import { saveProfile } from '../save-profile';
import { SectionManager, type ItemFormProps } from '../SectionManager';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function AvatarUpload() {
  const { profile, update, notify } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    // Same limits as the API, checked here first so a wrong file fails instantly.
    if (!AVATAR_TYPES.includes(file.type))
      return notify('error', 'Choose a JPG, PNG or WebP image.');
    if (file.size > AVATAR_MAX_BYTES) return notify('error', 'That image is larger than 2 MB.');

    const form = new FormData();
    form.append('avatar', file);
    setUploading(true);
    try {
      const { avatarUrl } = await api<{ avatarUrl: string }>('/profile/me/avatar', {
        method: 'POST',
        form,
      });
      update((p) => ({ ...p, avatarUrl }));
      notify('success', 'Photo updated.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {profile.avatarUrl ? (
        // A plain <img>, like the public theme: avatars can come from any host.
        <img
          src={profile.avatarUrl}
          alt="Your current photo"
          referrerPolicy="no-referrer"
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
        >
          {initials(profile.fullName)}
        </div>
      )}
      <div className="space-y-1">
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = ''; // picking the same file again should still trigger onChange
          }}
        />
        <Button disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? 'Uploading…' : profile.avatarUrl ? 'Change photo' : 'Upload photo'}
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG or WebP, up to 2 MB.</p>
        <SlowNotice pending={uploading} />
      </div>
    </div>
  );
}

const detailsSchema = profileUpdateSchema
  .pick({ fullName: true, tagline: true, location: true })
  .extend({ slug: slugSchema });
type DetailsFields = { fullName: string; tagline: string; location: string; slug: string };

const toFields = (p: MyProfile): DetailsFields => ({
  fullName: p.fullName,
  tagline: p.tagline ?? '',
  location: p.location ?? '',
  slug: p.slug,
});

function DetailsForm() {
  const { profile, update, setDraft, notify } = useEditor();
  const form = useForm<DetailsFields, unknown, z.output<typeof detailsSchema>>({
    resolver: schemaResolver(detailsSchema),
    defaultValues: toFields(profile),
  });
  const slug = useWatch({ control: form.control, name: 'slug' });

  // Typing shows up in the preview straight away; saving makes it permanent.
  useEffect(() => {
    const subscription = form.watch((v) =>
      setDraft({
        fullName: v.fullName ?? '',
        tagline: v.tagline || null,
        location: v.location || null,
      }),
    );
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft]);

  async function onSubmit(values: z.output<typeof detailsSchema>) {
    // The slug is only sent when it changed, so saving never re-checks an unchanged slug.
    const { slug: nextSlug, ...rest } = values;
    const saved = await saveProfile(profile, {
      ...rest,
      ...(nextSlug !== profile.slug && { slug: nextSlug }),
    });
    update(() => saved);
    form.reset(toFields(saved));
    notify('success', 'Saved.');
  }

  return (
    <EditorForm
      form={form}
      onSubmit={onSubmit}
      codeFields={{ SLUG_TAKEN: 'slug' }}
      submitLabel="Save details"
    >
      <TextField name="fullName" label="Full name" autoComplete="name" />
      <TextField
        name="tagline"
        label="Tagline"
        hint="One line under your name, for example your role."
      />
      <TextField name="location" label="Location" />
      <TextField
        name="slug"
        label="Page address"
        autoCapitalize="none"
        spellCheck={false}
        hint={`Your page will be at ${window.location.host}/${slug || 'your-name'}`}
      />
    </EditorForm>
  );
}

// ---- Links ----

const LINK_LABELS: Record<LinkType, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  other: 'Other link',
};
const PLACEHOLDERS: Record<LinkType, string> = {
  linkedin: 'https://linkedin.com/in/your-name',
  github: 'https://github.com/your-name',
  email: 'you@example.com',
  phone: '+1 555 123 4567',
  website: 'https://your-site.com',
  other: 'https://',
};
const TYPE_OPTIONS = linkTypeSchema.options.map((value) => ({ value, label: LINK_LABELS[value] }));

type LinkFields = { type: LinkType; url: string; visible: boolean };

function LinkForm({ item, onDone }: ItemFormProps<'links'>) {
  const { create, updateItem } = useSection('links');
  const form = useForm<LinkFields, unknown, LinkInput>({
    resolver: schemaResolver(linkInputSchema),
    defaultValues: item
      ? { type: item.type, url: item.url, visible: item.visible }
      : { type: 'linkedin', url: '', visible: true },
  });
  const type = useWatch({ control: form.control, name: 'type' });

  async function onSubmit(values: LinkInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save link" onCancel={onDone}>
      <SelectField name="type" label="Type" options={TYPE_OPTIONS} />
      <TextField
        name="url"
        label={type === 'email' ? 'Email address' : type === 'phone' ? 'Phone number' : 'URL'}
        placeholder={PLACEHOLDERS[type]}
        autoCapitalize="none"
        spellCheck={false}
      />
      <CheckboxField name="visible" label="Show on my portfolio" />
    </EditorForm>
  );
}

// Hiding a link keeps it saved but takes it off the public page.
function VisibilityToggle({ link }: { link: MyLink }) {
  const { updateItem } = useSection('links');
  const { notify } = useEditor();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await updateItem(link.id, { type: link.type, url: link.url, visible: !link.visible });
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'Could not update the link.');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={link.visible}
      aria-label={`Show ${LINK_LABELS[link.type]} on my portfolio`}
      disabled={pending}
      onClick={toggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 ${
        link.visible ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
          link.visible ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export function BasicsStep() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="photo-heading" className="space-y-4">
        <h2 id="photo-heading" className="text-lg font-semibold">
          Photo
        </h2>
        <AvatarUpload />
      </section>

      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="text-lg font-semibold">
          Details
        </h2>
        <DetailsForm />
      </section>

      <section aria-labelledby="links-heading" className="space-y-4">
        <div>
          <h2 id="links-heading" className="text-lg font-semibold">
            Links
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Use the switch to hide a link without deleting it.
          </p>
        </div>
        <SectionManager
          section="links"
          noun="link"
          addLabel="Add a link"
          empty="No links yet."
          summary={(link) => ({ title: LINK_LABELS[link.type], subtitle: link.url })}
          Form={LinkForm}
          extra={(link) => <VisibilityToggle link={link} />}
        />
      </section>
    </div>
  );
}
