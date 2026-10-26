'use client';

import { useState } from 'react';
import { api } from '@/lib/client-api';
import { SITE_URL } from '@/lib/config';
import { ShareButton } from '../ShareButton';
import { Button, Switch } from '../ui';
import { errorText, useEditor } from './editor-context';

type Step = 'basics' | 'about';

// The fields a portfolio is not much use without, and the editor step that fills each in.
const REQUIRED: {
  label: string;
  step: Step;
  isEmpty: (p: { fullName: string; about: string | null }) => boolean;
}[] = [
  { label: 'your name', step: 'basics', isEmpty: (p) => !p.fullName.trim() },
  { label: 'an About section', step: 'about', isEmpty: (p) => !p.about?.trim() },
];

// Publish switch, the public link (copy and open) and a warning when the page is thin.
export function PublishPanel({ onFix }: { onFix: (step: Step) => void }) {
  const { profile, update, notify, hasUnsaved } = useEditor();
  const [pending, setPending] = useState(false);
  const [warning, setWarning] = useState(false);
  const [copied, setCopied] = useState(false);

  const missing = REQUIRED.filter((field) => field.isEmpty(profile));
  const url = `${SITE_URL}/${profile.slug}`; // the canonical address, not whatever host this tab is on

  async function setPublished(published: boolean) {
    setWarning(false);
    setPending(true);
    try {
      const res = await api<{ published: boolean }>('/profile/me/publish', {
        method: 'POST',
        body: { published },
      });
      update((p) => ({ ...p, published: res.published }));
      notify('success', res.published ? 'Your portfolio is live.' : 'Your portfolio is hidden.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setPending(false);
    }
  }

  function onToggle() {
    if (profile.published) return void setPublished(false);
    // Warn, but let them go ahead: a half-empty page may be exactly what they want for now.
    if (missing.length > 0) return setWarning(true);
    void setPublished(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('error', 'Could not copy. Select the link and copy it by hand.');
    }
  }

  return (
    <section
      aria-label="Publishing"
      className="mx-4 mt-4 space-y-3 rounded-2xl border border-line p-4"
    >
      <div className="flex items-center gap-3">
        <Switch
          checked={profile.published}
          label="Published"
          disabled={pending}
          onClick={onToggle}
        />
        <div>
          <p className="font-medium">{profile.published ? 'Published' : 'Not published'}</p>
          <p className="text-sm text-muted">
            {profile.published
              ? 'Anyone with the link can see your portfolio.'
              : 'Only you can see it. Turn this on to make it public.'}
          </p>
        </div>
      </div>

      {profile.published && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 rounded-lg break-all bg-surface px-3 py-2 text-sm">
            {url}
          </code>
          <Button onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
          <ShareButton url={url} title={`${profile.fullName}'s portfolio`} variant="outline" />
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Open<span className="sr-only"> your portfolio in a new tab</span>
          </a>
        </div>
      )}

      {warning && (
        <div role="alert" className="space-y-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Your page is missing {missing.map((field) => field.label).join(' and ')}. Visitors will
            see an incomplete portfolio.
            {hasUnsaved() &&
              ' You also have unsaved changes: save them first and this may go away.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setWarning(false);
                onFix(missing[0].step);
              }}
            >
              Fix it first
            </Button>
            <Button onClick={() => setPublished(true)}>Publish anyway</Button>
            <Button variant="ghost" onClick={() => setWarning(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
