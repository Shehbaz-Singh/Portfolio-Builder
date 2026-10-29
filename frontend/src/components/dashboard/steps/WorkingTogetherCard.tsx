'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  WEEKDAYS,
  WEEK_DAYS,
  WORK_NOTE_MAX,
  closedWeek,
  contactAvailable,
  isTimeZone,
  profileUpdateSchema,
  workingHoursSchema,
  type MyProfile,
  type WeekDay,
  type WorkingHours,
} from '@parichay/shared';
import { schemaResolver } from '@/lib/form';
import { Form, SelectField } from '../../form-fields';
import { Button, Switch } from '../../ui';
import { cx } from '../../ui/cx';
import { useFormAutosave } from '../autosave';
import { useEditor } from '../editor-context';

const schema = profileUpdateSchema.pick({
  workCardEnabled: true,
  timezone: true,
  workingHours: true,
  replyTime: true,
  preferredContact: true,
  workNote: true,
});
type Fields = {
  workCardEnabled: boolean;
  timezone: string;
  workingHours: WorkingHours;
  replyTime: string;
  preferredContact: string;
  workNote: string;
};

const DAY_LABELS: Record<WeekDay, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const REPLY_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'same_day', label: 'Within the same day' },
  { value: 'within_2_days', label: 'Within 2 days' },
  { value: 'within_a_week', label: 'Within a week' },
];

const CONTACT_LABELS = {
  email: 'Email',
  linkedin: 'LinkedIn',
  phone: 'Phone',
  any_visible_link: 'Any link I show on my page',
} as const;

// A week where each of these days has one range, and the others are closed.
const week = (days: readonly WeekDay[], start: string, end: string): WorkingHours => ({
  ...closedWeek(),
  ...Object.fromEntries(days.map((day) => [day, [{ start, end }]])),
});

const PRESETS: { label: string; hours: () => WorkingHours }[] = [
  { label: 'Mon–Fri, 9 to 5', hours: () => week(WEEKDAYS, '09:00', '17:00') },
  { label: 'Mon–Fri, 10 to 6', hours: () => week(WEEKDAYS, '10:00', '18:00') },
  { label: 'Every day, 9 to 5', hours: () => week(WEEK_DAYS, '09:00', '17:00') },
];

const field = 'block w-full rounded-control border border-line bg-page px-3 py-2 text-sm';

const toFields = (p: MyProfile): Fields => ({
  workCardEnabled: p.workCardEnabled,
  timezone: p.timezone ?? '',
  workingHours: p.workingHours,
  replyTime: p.replyTime ?? '',
  preferredContact: p.preferredContact ?? '',
  workNote: p.workNote ?? '',
});

const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
};

// The names of every zone the browser knows, for the search list.
function allZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const list = intl.supportedValuesOf?.('timeZone') ?? [];
  return list.includes('UTC') ? list : ['UTC', ...list];
}

// ---- the time zone: type to search, and the browser's own zone is offered to confirm

function TimeZoneField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  const zones = useMemo(allZones, []);
  const [suggestion, setSuggestion] = useState('');
  useEffect(() => setSuggestion(browserZone()), []);
  const known = value === '' || isTimeZone(value);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Your time zone
      </label>
      <input
        id={id}
        type="text"
        list={`${id}-zones`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Start typing a city or region, e.g. Asia/Kolkata"
        aria-describedby={`${id}-note`}
        aria-invalid={!known || error ? true : undefined}
        className={field}
      />
      <datalist id={`${id}-zones`}>
        {zones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <div id={`${id}-note`} className="mt-1 space-y-1 text-xs text-muted">
        {!known && <p className="text-danger">Choose a time zone from the list.</p>}
        {error && known && <p className="text-danger">{error}</p>}
        {suggestion && suggestion !== value && (
          <p className="flex flex-wrap items-center gap-2">
            <span>Your browser says you are in {suggestion.replace(/_/g, ' ')}.</span>
            <Button size="sm" onClick={() => onChange(suggestion)}>
              Use {suggestion.replace(/_/g, ' ')}
            </Button>
          </p>
        )}
      </div>
    </div>
  );
}

// ---- the weekly hours

function DayRow({
  day,
  ranges,
  onChange,
  error,
}: {
  day: WeekDay;
  ranges: WorkingHours[WeekDay];
  onChange: (ranges: WorkingHours[WeekDay]) => void;
  error?: string;
}) {
  const open = ranges.length > 0;
  const label = DAY_LABELS[day];
  const set = (index: number, key: 'start' | 'end', value: string) =>
    onChange(ranges.map((range, i) => (i === index ? { ...range, [key]: value } : range)));
  return (
    <li className="rounded-control border border-line p-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex min-w-32 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => onChange(e.target.checked ? [{ start: '09:00', end: '17:00' }] : [])}
            className="size-4"
          />
          {label}
          <span className="sr-only">{open ? ', open' : ', closed'}</span>
        </label>
        {!open && <span className="text-sm text-muted">Closed</span>}
        {ranges.map((range, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={range.start}
              aria-label={`${label}, range ${index + 1} start`}
              onChange={(e) => set(index, 'start', e.target.value)}
              className={cx(field, 'w-auto')}
            />
            <span aria-hidden="true">–</span>
            <input
              type="time"
              value={range.end}
              aria-label={`${label}, range ${index + 1} end`}
              onChange={(e) => set(index, 'end', e.target.value)}
              className={cx(field, 'w-auto')}
            />
            {index === 1 && (
              <Button size="sm" onClick={() => onChange(ranges.slice(0, 1))}>
                Remove<span className="sr-only"> second range for {label}</span>
              </Button>
            )}
          </div>
        ))}
        {open && ranges.length === 1 && (
          <Button size="sm" onClick={() => onChange([...ranges, { start: '18:00', end: '20:00' }])}>
            Add a second range<span className="sr-only"> for {label}</span>
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {label}: {error}
        </p>
      )}
    </li>
  );
}

function HoursEditor({
  value,
  onChange,
}: {
  value: WorkingHours;
  onChange: (value: WorkingHours) => void;
}) {
  const parsed = workingHoursSchema.safeParse(value);
  const errors: Partial<Record<WeekDay, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const day = issue.path[0] as WeekDay;
      errors[day] ??= issue.message;
    }
  }
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Weekly hours</legend>
      <p className="text-xs text-muted">
        In your time zone, on a 24-hour clock. A day can have one or two ranges; a range does not
        cross midnight.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button key={preset.label} size="sm" onClick={() => onChange(preset.hours())}>
            {preset.label}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => {
            const monday = value.mon;
            onChange({
              ...value,
              ...Object.fromEntries(WEEKDAYS.map((day) => [day, monday.map((r) => ({ ...r }))])),
            });
          }}
        >
          Copy Monday to all weekdays
        </Button>
      </div>
      <ul className="space-y-2">
        {WEEK_DAYS.map((day) => (
          <DayRow
            key={day}
            day={day}
            ranges={value[day]}
            error={errors[day]}
            onChange={(ranges) => onChange({ ...value, [day]: ranges })}
          />
        ))}
      </ul>
    </fieldset>
  );
}

// ---- the card

// A small card on the public page: your local time, whether you are at work, your weekly hours and how
// to reach you. It saves by itself like the cards around it, and shows in the live preview.
export function WorkingTogetherCard() {
  const { profile, saveFields, setDraft } = useEditor();
  const form = useForm<Fields, unknown, z.output<typeof schema>>({
    resolver: schemaResolver(schema),
    defaultValues: toFields(profile),
  });
  const { control } = form;
  const enabled = useWatch({ control, name: 'workCardEnabled' });
  const note = useWatch({ control, name: 'workNote' }) ?? '';

  // Only the ways of being reached that map to a link the owner shows.
  const visibleTypes = profile.links.filter((link) => link.visible).map((link) => link.type);
  const contactOptions = [
    { value: '', label: 'Not set' },
    ...(['email', 'linkedin', 'phone', 'any_visible_link'] as const)
      .filter((contact) => contactAvailable(contact, visibleTypes))
      .map((contact) => ({ value: contact, label: CONTACT_LABELS[contact] })),
  ];

  useEffect(() => {
    let hours = profile.workingHours;
    const publish = (v: Partial<Fields>) => {
      // While a range is half typed the preview keeps the last complete week.
      const parsed = workingHoursSchema.safeParse(v.workingHours);
      if (parsed.success) hours = parsed.data;
      const zone = v.timezone?.trim() ?? '';
      setDraft(
        {
          workCardEnabled: !!v.workCardEnabled,
          timezone: zone && isTimeZone(zone) ? zone : null,
          workingHours: hours,
          replyTime: (v.replyTime || null) as MyProfile['replyTime'],
          preferredContact: (v.preferredContact || null) as MyProfile['preferredContact'],
          workNote: v.workNote?.trim() || null,
        },
        'work',
      );
    };
    publish(form.getValues());
    const subscription = form.watch((v) => publish(v as Partial<Fields>));
    return () => {
      subscription.unsubscribe();
      setDraft(null, 'work');
    };
  }, [form, setDraft, profile.workingHours]);

  async function save(values: z.output<typeof schema>) {
    await saveFields(values);
  }
  useFormAutosave(form, save);

  const noteId = 'work-note-note';
  const near = note.length >= WORK_NOTE_MAX - 10;
  const errors = form.formState.errors;

  return (
    <Form form={form} onSubmit={save}>
      <div className="space-y-4 rounded-card border border-line p-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show a “Working together” card</p>
            <p className="text-xs text-muted">
              Your local time, when you are at work, how soon you reply and the best way to reach
              you. Visitors see your time next to theirs.
            </p>
          </div>
          <Controller
            control={control}
            name="workCardEnabled"
            render={({ field: f }) => (
              <Switch
                checked={!!f.value}
                label="Show a Working together card on my page"
                onClick={() => f.onChange(!f.value)}
              />
            )}
          />
        </div>

        {enabled && (
          <>
            <Controller
              control={control}
              name="timezone"
              render={({ field: f }) => (
                <TimeZoneField
                  value={f.value}
                  onChange={f.onChange}
                  error={errors.timezone?.message as string | undefined}
                />
              )}
            />
            <Controller
              control={control}
              name="workingHours"
              render={({ field: f }) => <HoursEditor value={f.value} onChange={f.onChange} />}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField name="replyTime" label="Typical reply time" options={REPLY_OPTIONS} />
              <SelectField
                name="preferredContact"
                label="Best way to reach you"
                options={contactOptions}
              />
            </div>
            <div>
              <label htmlFor="work-note" className="mb-1 block text-sm font-medium">
                A note (optional)
              </label>
              <input
                id="work-note"
                type="text"
                maxLength={WORK_NOTE_MAX}
                autoComplete="off"
                placeholder="e.g. Best before noon on weekdays"
                aria-describedby={noteId}
                className={field}
                {...form.register('workNote')}
              />
              <p id={noteId} className="mt-1 flex justify-between gap-3 text-xs text-muted">
                <span>Plain text, one short line.</span>
                <span className={cx('shrink-0 tabular-nums', near && 'font-medium text-danger')}>
                  {note.length}/{WORK_NOTE_MAX}
                  <span className="sr-only"> characters</span>
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </Form>
  );
}
