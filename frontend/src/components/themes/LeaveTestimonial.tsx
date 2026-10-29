'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  HONEYPOT_FIELD,
  TESTIMONIAL_COMPANY_MAX,
  TESTIMONIAL_EMAIL_MAX,
  TESTIMONIAL_MESSAGE_MAX,
  TESTIMONIAL_NAME_MAX,
  TESTIMONIAL_ROLE_MAX,
  testimonialSubmissionSchema,
  type TestimonialSubmission,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { fill, uiFor, type Ui } from '@/lib/i18n';
import { Form, TextArea, TextField } from '../form-fields';

type Fields = {
  authorName: string;
  authorRole: string;
  authorCompany: string;
  message: string;
  contactEmail: string;
  [HONEYPOT_FIELD]: string;
};

const EMPTY: Fields = {
  authorName: '',
  authorRole: '',
  authorCompany: '',
  message: '',
  contactEmail: '',
  [HONEYPOT_FIELD]: '',
};

// "Leave a testimonial": a button that opens a form, then a thank-you. Anything sent waits for
// the owner's approval, and the message says so. The button's look comes from the theme; the
// form uses the page's own colors, so it fits all of them.
export function LeaveTestimonial({
  slug,
  buttonClassName,
  ui = uiFor('en').leave,
}: {
  slug: string;
  buttonClassName: string;
  ui?: Ui['leave'];
}) {
  const [step, setStep] = useState<'closed' | 'open' | 'sent'>('closed');
  const headingId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const moved = useRef(false); // false until the person has opened the form (nothing to refocus)

  const form = useForm<Fields, unknown, TestimonialSubmission>({
    resolver: schemaResolver(testimonialSubmissionSchema),
    defaultValues: EMPTY,
  });

  // Keyboard users follow the change: into the first field when the form opens, onto the thank-you
  // when it is sent, back on the button when the form is cancelled.
  useEffect(() => {
    if (step === 'open') {
      moved.current = true;
      panel.current?.querySelector('input')?.focus();
    } else if (step === 'sent') {
      panel.current?.focus();
    } else if (moved.current) {
      button.current?.focus();
    }
  }, [step]);

  async function onSubmit(values: TestimonialSubmission) {
    await api(`/public/${encodeURIComponent(slug)}/testimonials`, {
      method: 'POST',
      body: values,
      redirectOn401: false,
    });
    setStep('sent');
  }

  if (step === 'sent') {
    return (
      <div
        ref={panel}
        tabIndex={-1}
        role="status"
        className="mt-8 rounded-xl border border-line p-5 focus-visible:outline-2 focus-visible:outline-accent-fg"
      >
        <p className="font-semibold">{ui.thanks}</p>
        <p className="mt-1 text-muted">{ui.intro}</p>
      </div>
    );
  }

  if (step === 'closed') {
    return (
      <div className="mt-8">
        <button
          ref={button}
          type="button"
          className={buttonClassName}
          onClick={() => setStep('open')}
        >
          {ui.open}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panel}
      role="group"
      aria-labelledby={headingId}
      className="mt-8 rounded-xl border border-line bg-page p-5"
    >
      <h3 id={headingId} className="mb-1 text-lg font-semibold">
        {ui.open}
      </h3>
      <p className="mb-4 text-sm text-muted">{ui.intro}</p>
      <Form
        form={form}
        onSubmit={onSubmit}
        submitLabel={ui.send}
        pendingLabel={ui.sending}
        onCancel={() => setStep('closed')}
        cancelLabel={ui.cancel}
      >
        <TextField
          name="authorName"
          label={ui.name}
          maxLength={TESTIMONIAL_NAME_MAX}
          autoComplete="name"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="authorRole"
            label={ui.role}
            maxLength={TESTIMONIAL_ROLE_MAX}
            autoComplete="organization-title"
          />
          <TextField
            name="authorCompany"
            label={ui.company}
            maxLength={TESTIMONIAL_COMPANY_MAX}
            autoComplete="organization"
          />
        </div>
        <TextArea
          name="message"
          label={ui.message}
          rows={5}
          maxLength={TESTIMONIAL_MESSAGE_MAX}
          hint={fill(ui.messageHint, { min: 20, max: TESTIMONIAL_MESSAGE_MAX })}
          required
        />
        <TextField
          name="contactEmail"
          label={ui.email}
          type="email"
          maxLength={TESTIMONIAL_EMAIL_MAX}
          autoComplete="email"
          hint={ui.emailHint}
        />
        {/* The honeypot: people never see or reach it, bots fill it in. It comes last, so the
            first input of the panel is the name. */}
        <div aria-hidden="true" className="sr-only">
          <label>
            {ui.honeypot}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register(HONEYPOT_FIELD)}
            />
          </label>
        </div>
      </Form>
    </div>
  );
}
