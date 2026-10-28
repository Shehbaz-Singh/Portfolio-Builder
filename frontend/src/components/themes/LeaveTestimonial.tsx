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
}: {
  slug: string;
  buttonClassName: string;
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
        <p className="font-semibold">Thank you! Your testimonial has been sent.</p>
        <p className="mt-1 text-muted">It will appear on this page after the owner approves it.</p>
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
          Leave a testimonial
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
        Leave a testimonial
      </h3>
      <p className="mb-4 text-sm text-muted">
        It will appear on this page after the owner approves it.
      </p>
      <Form
        form={form}
        onSubmit={onSubmit}
        submitLabel="Send testimonial"
        pendingLabel="Sending…"
        onCancel={() => setStep('closed')}
      >
        <TextField
          name="authorName"
          label="Your name"
          maxLength={TESTIMONIAL_NAME_MAX}
          autoComplete="name"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="authorRole"
            label="Your role (optional)"
            maxLength={TESTIMONIAL_ROLE_MAX}
            autoComplete="organization-title"
          />
          <TextField
            name="authorCompany"
            label="Your company (optional)"
            maxLength={TESTIMONIAL_COMPANY_MAX}
            autoComplete="organization"
          />
        </div>
        <TextArea
          name="message"
          label="Your testimonial"
          rows={5}
          maxLength={TESTIMONIAL_MESSAGE_MAX}
          hint={`20 to ${TESTIMONIAL_MESSAGE_MAX} characters, plain text.`}
          required
        />
        <TextField
          name="contactEmail"
          label="Your email (optional)"
          type="email"
          maxLength={TESTIMONIAL_EMAIL_MAX}
          autoComplete="email"
          hint="Only the owner sees this. It is never shown on the page."
        />
        {/* The honeypot: people never see or reach it, bots fill it in. It comes last, so the
            first input of the panel is the name. */}
        <div aria-hidden="true" className="sr-only">
          <label>
            Leave this field empty
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
