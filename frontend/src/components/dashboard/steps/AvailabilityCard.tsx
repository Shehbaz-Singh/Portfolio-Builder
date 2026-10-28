'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_MESSAGE_MAX,
  AVAILABILITY_STATUSES,
  availabilityText,
  profileUpdateSchema,
  type AvailabilityStatus,
  type MyProfile,
} from '@portfolio/shared';
import { schemaResolver } from '@/lib/form';
import { contactTarget } from '@/lib/format';
import { Form, SelectField } from '../../form-fields';
import { Switch } from '../../ui';
import { cx } from '../../ui/cx';
import { useFormAutosave } from '../autosave';
import { useEditor } from '../editor-context';

const schema = profileUpdateSchema.pick({
  availabilityEnabled: true,
  availabilityStatus: true,
  availabilityMessage: true,
});
type Fields = {
  availabilityEnabled: boolean;
  availabilityStatus: AvailabilityStatus;
  availabilityMessage: string;
};

const toFields = (p: MyProfile): Fields => ({
  availabilityEnabled: p.availabilityEnabled,
  availabilityStatus: p.availabilityStatus,
  availabilityMessage: p.availabilityMessage ?? '',
});

const OPTIONS = AVAILABILITY_STATUSES.map((value) => ({
  value,
  label: value === 'custom' ? 'Write my own message' : AVAILABILITY_LABELS[value],
}));

// A small badge near the top of the page that says you're open to work. It saves by itself like the
// details above it, and shows in the live preview as you change it.
export function AvailabilityCard() {
  const { profile, saveFields, setDraft } = useEditor();
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: toFields(profile),
  });
  const { control, register } = form;
  const enabled = useWatch({ control, name: 'availabilityEnabled' });
  const status = useWatch({ control, name: 'availabilityStatus' });
  const message = useWatch({ control, name: 'availabilityMessage' }) ?? '';

  useEffect(() => {
    const publish = (v: Partial<Fields>) =>
      setDraft(
        {
          availabilityEnabled: !!v.availabilityEnabled,
          availabilityStatus: v.availabilityStatus ?? 'open_to_work',
          availabilityMessage: v.availabilityMessage?.trim() || null,
        },
        'availability',
      );
    publish(form.getValues());
    const subscription = form.watch(publish);
    return () => {
      subscription.unsubscribe();
      setDraft(null, 'availability');
    };
  }, [form, setDraft]);

  async function save(values: z.output<typeof schema>) {
    await saveFields(values);
  }
  useFormAutosave(form, save);

  const custom = status === 'custom';
  const { label } = availabilityText(status, message);
  const hasContact = contactTarget(profile.links.filter((link) => link.visible)) !== null;
  const noteId = 'availability-message-note';
  const near = message.length >= AVAILABILITY_MESSAGE_MAX - 10;

  return (
    <Form form={form} onSubmit={save}>
      <div className="space-y-4 rounded-card border border-line p-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show an availability badge</p>
            <p className="text-xs text-muted">
              A small note at the top of your page, so people know it’s a good time to get in touch.
            </p>
          </div>
          <Controller
            control={control}
            name="availabilityEnabled"
            render={({ field }) => (
              <Switch
                checked={!!field.value}
                label="Show an availability badge on my page"
                onClick={() => field.onChange(!field.value)}
              />
            )}
          />
        </div>

        {enabled && (
          <>
            <SelectField name="availabilityStatus" label="Status" options={OPTIONS} />
            {/* Not TextField: the counter sits with the hint, and maxLength stops typing at the limit. */}
            <div>
              <label htmlFor="availability-message" className="mb-1 block text-sm font-medium">
                {custom ? 'Your message' : 'Add a note (optional)'}
              </label>
              <input
                id="availability-message"
                type="text"
                maxLength={AVAILABILITY_MESSAGE_MAX}
                autoComplete="off"
                placeholder={
                  custom
                    ? 'e.g. Taking on new design projects from January'
                    : 'e.g. Especially interested in design systems roles'
                }
                aria-describedby={noteId}
                className="block w-full rounded-control border border-line bg-page px-3 py-2 text-sm"
                {...register('availabilityMessage')}
              />
              <p id={noteId} className="mt-1 flex justify-between gap-3 text-xs text-muted">
                <span>
                  {custom
                    ? 'This replaces the standard wording. Keep it to one short line.'
                    : `Left blank, your page says “${label}”.`}
                </span>
                <span className={cx('shrink-0 tabular-nums', near && 'font-medium text-danger')}>
                  {message.length}/{AVAILABILITY_MESSAGE_MAX}
                  <span className="sr-only"> characters</span>
                </span>
              </p>
            </div>
            {!hasContact && (
              <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
                People can’t reach you from the badge yet. Add an email, phone, LinkedIn or website
                link below and keep it shown on your portfolio, and the badge will link to it.
              </p>
            )}
          </>
        )}
      </div>
    </Form>
  );
}
