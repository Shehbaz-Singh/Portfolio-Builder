'use client';

import { useRef, useState } from 'react';
import type { ResumeResponse } from '@portfolio/shared';
import { ApiError, api } from '@/lib/client-api';
import { Button, ErrorText, SlowNotice } from '../../ui';
import { useEditor } from '../editor-context';

// Larger than the API's 5 MB limit is refused there too; this lower one is what fits through
// the site's /api proxy on Vercel (its request bodies are capped at 4.5 MB).
const MAX_BYTES = 4.5 * 1024 * 1024;

// First step of onboarding: read a resume PDF and fill in what it says. Nothing is saved here.
// The parsed result lands in the other steps' forms as unsaved edits and suggestions.
export function ImportStep({ goTo }: { goTo: (stepId: string) => void }) {
  const { applyImport, hasPendingImport, notify } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string>();
  const [empty, setEmpty] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    setEmpty(false);
    // The same limits as the API, checked first so a wrong file fails at once.
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return setError('Choose a PDF file.');
    }
    if (file.size > MAX_BYTES) return setError('That PDF is larger than 4.5 MB.');

    const form = new FormData();
    form.append('resume', file);
    setReading(true);
    try {
      const { resume, skipped } = await api<ResumeResponse>('/profile/me/resume', {
        method: 'POST',
        form,
      });
      applyImport(resume, skipped);
      notify('success', 'Resume read. Check each step, then save.');
      goTo('basics');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      // Only a missing key means "do not try again": offer the manual route clearly.
      setEmpty(err instanceof ApiError && err.code === 'RESUME_IMPORT_UNAVAILABLE');
    } finally {
      setReading(false);
    }
  }

  return (
    <section aria-labelledby="import-heading" className="space-y-5">
      <div>
        <h2 id="import-heading" className="text-lg font-semibold">
          Start from your resume
        </h2>
        <p className="mt-1 text-sm text-muted">
          Upload a PDF and we fill in what we can find: your details, links, skills, jobs, education
          and projects. You review and fix everything first, and nothing is saved until you save it.
        </p>
      </div>

      {hasPendingImport && (
        <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-ink">
          You have a resume waiting for review. Go through the other steps, or upload a different
          one to replace it.
        </p>
      )}

      <div className="space-y-3 rounded-2xl border border-dashed border-line p-6 text-center">
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = ''; // choosing the same file again should still trigger onChange
          }}
        />
        <Button variant="primary" disabled={reading} onClick={() => input.current?.click()}>
          {reading ? 'Reading your resume…' : 'Choose a PDF'}
        </Button>
        <p className="text-xs text-muted">
          PDF with selectable text, up to 4.5 MB. Scanned images are not supported.
        </p>
        <p role="status" className="text-sm text-muted">
          {reading ? 'Reading your resume. This usually takes 10 to 20 seconds.' : ''}
        </p>
        <SlowNotice pending={reading} />
        <ErrorText>{error}</ErrorText>
      </div>

      <p className="text-xs text-muted">
        The PDF is not stored. Its text is sent to an AI service to be read, and only the result is
        kept in this page until you save it.
      </p>

      <Button variant={empty ? 'primary' : 'ghost'} onClick={() => goTo('basics')}>
        {empty ? 'Fill it in by hand' : 'Skip, I will fill it in myself'}
      </Button>
    </section>
  );
}

// Shown while anything read from a resume is still waiting for review. The parsed data is
// not stored anywhere, so this is also where someone can throw it away.
export function ImportBanner() {
  const { imported, hasPendingImport, discardImport } = useEditor();
  if (!imported || !hasPendingImport) return null;

  return (
    <section
      aria-label="Resume import"
      className="mx-4 mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-accent-soft p-4 text-sm text-ink"
    >
      <div className="max-w-2xl space-y-1">
        <p className="font-medium">Imported from your resume. Nothing is saved yet.</p>
        <p>
          Check each step. Your details are filled in as unsaved edits, so review them and press
          Save. Skills, jobs, projects, education and links are listed as suggestions to edit and
          add, or skip.
        </p>
        {imported.skipped > 0 && (
          <p>
            {imported.skipped} {imported.skipped === 1 ? 'entry' : 'entries'} could not be read (for
            example a job without dates), so add {imported.skipped === 1 ? 'it' : 'those'} by hand
            if you need {imported.skipped === 1 ? 'it' : 'them'}.
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          if (window.confirm('Discard everything read from your resume?')) discardImport();
        }}
      >
        Discard import
      </Button>
    </section>
  );
}
