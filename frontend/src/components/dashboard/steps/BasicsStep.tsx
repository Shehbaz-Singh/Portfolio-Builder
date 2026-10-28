'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  linkInputSchema,
  linkTypeSchema,
  profileUpdateSchema,
  slugSchema,
  type LinkInput,
  type LinkType,
  type MyLink,
  type MyProfile,
} from '@parichay/shared';
import { Link2 } from 'lucide-react';
import { ApiError, api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { initials } from '@/lib/format';
import { CheckboxField, Form, SelectField, TextField } from '../../form-fields';
import { Button, SlowNotice, Switch } from '../../ui';
import { useFormAutosave } from '../autosave';
import { EditorForm } from '../EditorForm';
import { errorText, useEditor, useReportDirty, useSection } from '../editor-context';
import { SectionManager, type ItemFormProps } from '../SectionManager';
import { AvailabilityCard } from './AvailabilityCard';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function AvatarUpload() {
  const { profile, update, notify } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onRemove() {
    setUploading(true);
    try {
      await api('/profile/me/avatar', { method: 'DELETE' });
      update((p) => ({ ...p, avatarUrl: null }));
      notify('success', 'Photo removed. Your initials will show instead.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setUploading(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    // Same limits as the API, checked here first so a wrong file fails instantly.
    if (!AVATAR_TYPES.includes(file.type))
      return notify('error', "That file type won't work. Choose a JPG, PNG or WebP image.");
    if (file.size > AVATAR_MAX_BYTES)
      return notify(
        'error',
        'That image is over 2 MB. Choose a smaller one, or shrink it and try again.',
      );

    const form = new FormData();
    form.append('avatar', file);
    setUploading(true);
    try {
      const { avatarUrl } = await api<{ avatarUrl: string }>('/profile/me/avatar', {
        method: 'POST',
        form,
      });
      update((p) => ({ ...p, avatarUrl }));
      notify('success', 'Looking good. Your photo is up.');
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
          alt="Your current avatar"
          referrerPolicy="no-referrer"
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-2xl font-semibold text-accent"
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
        <div className="flex gap-2">
          <Button disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? 'Working…' : profile.avatarUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {profile.avatarUrl && (
            <Button variant="danger" disabled={uploading} onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">JPG, PNG or WebP, up to 2 MB.</p>
        <SlowNotice pending={uploading} />
      </div>
    </div>
  );
}

const detailsSchema = profileUpdateSchema.pick({ fullName: true, tagline: true, location: true });
type DetailsFields = { fullName: string; tagline: string; location: string };

const toFields = (p: MyProfile): DetailsFields => ({
  fullName: p.fullName,
  tagline: p.tagline ?? '',
  location: p.location ?? '',
});

// Saves by itself shortly after typing stops. Details read from a resume are the exception: they
// arrive as edits to review and are only saved by the button, so nothing from a resume is saved
// unseen.
function DetailsForm() {
  const { profile, saveFields, setDraft, notify, takeFields } = useEditor();
  const [reviewing, setReviewing] = useState(false);
  const form = useForm<DetailsFields, unknown, z.output<typeof detailsSchema>>({
    resolver: schemaResolver(detailsSchema),
    defaultValues: toFields(profile),
  });
  useReportDirty(reviewing);

  // Typing shows up in the preview straight away, before it is saved.
  useEffect(() => {
    const publish = (v: Partial<DetailsFields>) =>
      setDraft({
        fullName: v.fullName ?? '',
        tagline: v.tagline || null,
        location: v.location || null,
      });
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null);
    };
  }, [form, setDraft]);

  useEffect(() => {
    const imported = takeFields(['fullName', 'tagline', 'location']);
    for (const key of ['fullName', 'tagline', 'location'] as const) {
      const value = imported[key];
      if (value) {
        form.setValue(key, value, { shouldDirty: true });
        setReviewing(true);
      }
    }
  }, [form, takeFields]);

  async function save(values: z.output<typeof detailsSchema>) {
    await saveFields(values);
    if (reviewing) {
      setReviewing(false);
      notify('success', 'Saved.');
    }
  }
  useFormAutosave(form, save, { enabled: !reviewing });

  return (
    <Form form={form} onSubmit={save} submitLabel={reviewing ? 'Save details' : undefined}>
      <TextField
        name="fullName"
        label="Full name"
        placeholder="e.g. Priya Sharma"
        hint="The name you want people to see at the top of your page."
        autoComplete="name"
        required
      />
      <TextField
        name="tagline"
        label="Tagline"
        placeholder="e.g. Product designer who loves simple, useful interfaces"
        hint="One short line under your name: what you do, and who you do it for. Save the longer story for the About tab."
      />
      <TextField
        name="location"
        label="Location"
        placeholder="e.g. Pune, India"
        hint="A city or region is plenty. Leave it blank if you'd rather not say."
      />
    </Form>
  );
}

// The address is saved with a button, not automatically: half a typed address is not one worth
// claiming, and changing it moves the page.
const addressSchema = z.object({ slug: slugSchema });

function SlugForm() {
  const { profile, saveFields, notify } = useEditor();
  const form = useForm<{ slug: string }, unknown, z.output<typeof addressSchema>>({
    resolver: schemaResolver(addressSchema),
    defaultValues: { slug: profile.slug },
  });
  const slug = useWatch({ control: form.control, name: 'slug' });

  async function onSubmit(values: z.output<typeof addressSchema>) {
    if (values.slug !== profile.slug) {
      const saved = await saveFields({ slug: values.slug });
      notify('success', 'Page address saved.');
      form.reset({ slug: saved.slug });
    }
  }

  return (
    <EditorForm
      form={form}
      onSubmit={onSubmit}
      codeFields={{ SLUG_TAKEN: 'slug' }}
      submitLabel="Save address"
    >
      <TextField
        name="slug"
        label="Page address"
        required
        autoCapitalize="none"
        spellCheck={false}
        hint={`Your page will live at ${window.location.host}/${slug || 'your-name'}. Short and easy to say out loud works best.`}
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

function LinkForm({ item, draft, onDone, onSaved }: ItemFormProps<'links'>) {
  const { create, updateItem } = useSection('links');
  const source = item ?? draft; // a saved link, or a suggestion from a resume
  const form = useForm<LinkFields, unknown, LinkInput>({
    resolver: schemaResolver(linkInputSchema),
    defaultValues: source
      ? {
          type: source.type,
          url: source.url,
          visible: (source as { visible?: boolean }).visible ?? true,
        }
      : { type: 'linkedin', url: '', visible: true },
  });
  const type = useWatch({ control: form.control, name: 'type' });

  async function onSubmit(values: LinkInput) {
    await (item ? updateItem(item.id, values) : create(values));
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm form={form} onSubmit={onSubmit} submitLabel="Save link" onCancel={onDone}>
      <SelectField name="type" label="Type" options={TYPE_OPTIONS} />
      <TextField
        name="url"
        label={type === 'email' ? 'Email address' : type === 'phone' ? 'Phone number' : 'URL'}
        placeholder={PLACEHOLDERS[type]}
        required
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
      notify(
        'error',
        err instanceof ApiError ? err.message : "We couldn't update that link. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Switch
      checked={link.visible}
      label={`Show ${LINK_LABELS[link.type]} on my portfolio`}
      disabled={pending}
      onClick={toggle}
    />
  );
}

export function BasicsStep() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="photo-heading" className="space-y-4">
        <h2 id="photo-heading" className="type-section">
          Photo
        </h2>
        <AvatarUpload />
      </section>

      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="type-section">
          Details
        </h2>
        <DetailsForm />
      </section>

      <section aria-labelledby="availability-heading" className="space-y-4">
        <h2 id="availability-heading" className="type-section">
          Availability
        </h2>
        <AvailabilityCard />
      </section>

      <section aria-labelledby="address-heading" className="space-y-4">
        <h2 id="address-heading" className="type-section">
          Page address
        </h2>
        <SlugForm />
      </section>

      <section aria-labelledby="links-heading" className="space-y-4">
        <div>
          <h2 id="links-heading" className="type-section">
            Links
          </h2>
          <p className="text-sm text-muted">
            Add the places people can find you. Drag the grip to reorder, and use the switch to hide
            a link without deleting it.
          </p>
        </div>
        <SectionManager
          section="links"
          noun="link"
          addLabel="Add a link"
          icon={Link2}
          empty="Nothing here yet. Add your LinkedIn, GitHub or email so people can get in touch."
          summary={(link) => ({ title: LINK_LABELS[link.type], subtitle: link.url })}
          Form={LinkForm}
          extra={(link) => <VisibilityToggle link={link} />}
        />
      </section>
    </div>
  );
}
