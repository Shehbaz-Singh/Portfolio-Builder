'use client';

import { useState } from 'react';
import { Check, CircleAlert, Copy, ExternalLink, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/client-api';
import { readFlag, writeFlag } from '@/lib/storage';
import { SITE_URL } from '@/lib/config';
import { ShareButton } from '../ShareButton';
import { Button, Modal, Switch, buttonStyles } from '../ui';
import { errorText, useEditor, type SaveStatus } from './editor-context';
import { useGo } from './navigation';
import { PublishCelebration } from './PublishCelebration';

// The fields a portfolio is not much use without, and the Profile tab that fills each in.
const REQUIRED: {
  label: string;
  tab: string;
  isEmpty: (p: { fullName: string; about: string | null }) => boolean;
}[] = [
  { label: 'your name', tab: 'basics', isEmpty: (p) => !p.fullName.trim() },
  { label: 'an About section', tab: 'about', isEmpty: (p) => !p.about?.trim() },
];

const STATUS_TEXT: Record<SaveStatus | 'dirty', string> = {
  saved: 'All saved',
  pending: 'Saving in a moment…',
  dirty: 'Not saved yet',
  saving: 'Saving…',
  invalid: 'Check the highlighted fields and we’ll save',
  error: 'We couldn’t save. Your changes are still here',
};

// Whether what you see is safe on the server. Screen readers hear every state except "Saving…",
// which comes and goes too quickly to be worth announcing.
function SaveIndicator() {
  const { saveStatus, unsaved, retrySave } = useEditor();
  const key = saveStatus === 'saved' && unsaved ? 'dirty' : saveStatus;
  const text = STATUS_TEXT[key];
  const bad = key === 'error' || key === 'invalid';
  return (
    <div className="flex items-center gap-2 text-sm">
      <span aria-hidden="true" className={bad ? 'text-danger' : 'text-muted'}>
        {key === 'saved' ? (
          <Check className="size-4" />
        ) : key === 'saving' ? (
          <LoaderCircle className="size-4 motion-safe:animate-spin" />
        ) : bad ? (
          <CircleAlert className="size-4" />
        ) : (
          <span className="block size-2.5 rounded-full bg-warning-fg" />
        )}
      </span>
      <span aria-hidden="true" className={bad ? 'font-medium text-danger' : 'text-muted'}>
        {text}
      </span>
      <span role="status" className="sr-only">
        {key === 'saving' ? '' : text}
      </span>
      {key === 'error' && retrySave && (
        <Button size="sm" onClick={retrySave}>
          Retry
        </Button>
      )}
    </div>
  );
}

function PublishControls() {
  const { profile, update, notify } = useEditor();
  const go = useGo();
  const [pending, setPending] = useState(false);
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const missing = REQUIRED.filter((field) => field.isEmpty(profile));
  const url = `${SITE_URL}/${profile.slug}`; // the canonical address, not whatever host this tab is on

  async function setPublished(published: boolean) {
    setAsking(false);
    setPending(true);
    try {
      const res = await api<{ published: boolean }>('/profile/me/publish', {
        method: 'POST',
        body: { published },
      });
      update((p) => ({ ...p, published: res.published }));
      // The first time it goes live is a moment worth marking; after that a quiet note will do.
      const celebratedKey = `celebrated:${profile.id}`;
      if (res.published && !readFlag(celebratedKey)) {
        writeFlag(celebratedKey);
        setCelebrating(true);
      } else {
        notify(
          'success',
          res.published
            ? 'Your portfolio is live again.'
            : 'Your portfolio is hidden. Only you can see it now, and you can publish it again any time.',
        );
      }
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setPending(false);
    }
  }

  function onToggle() {
    if (profile.published) return void setPublished(false);
    // Ask, but let them go ahead: a half-empty page may be exactly what they want for now.
    if (missing.length > 0) return setAsking(true);
    void setPublished(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('error', "We couldn't copy the link automatically. Select it and copy it by hand.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          checked={profile.published}
          label="Published"
          disabled={pending}
          onClick={onToggle}
        />
        <span className="text-sm font-medium">{profile.published ? 'Published' : 'Draft'}</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <code className="hidden min-w-0 truncate rounded-control bg-surface px-2 py-1 text-xs md:block">
          {url.replace(/^https?:\/\//, '')}
        </code>
        <Button size="sm" onClick={copy}>
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          <span className="max-sm:sr-only">{copied ? 'Copied' : 'Copy link'}</span>
          <span className="sr-only md:hidden"> to {url.replace(/^https?:\/\//, '')}</span>
        </Button>
        {profile.published && (
          <>
            <a
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: 'sm' })}
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="max-sm:sr-only">Open</span>
              <span className="sr-only"> your portfolio in a new tab</span>
            </a>
            <span className="hidden lg:block">
              <ShareButton url={url} title={`${profile.fullName}'s portfolio`} variant="outline" />
            </span>
          </>
        )}
      </div>

      <PublishCelebration
        open={celebrating}
        onClose={() => setCelebrating(false)}
        url={url}
        slug={profile.slug}
        name={profile.fullName}
      />

      <Modal
        open={asking}
        onClose={() => setAsking(false)}
        title="Your page isn’t quite finished"
        description={`It’s still missing ${missing.map((field) => field.label).join(' and ')}. You can publish now and finish later, but visitors will see it as it is.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAsking(false);
                void go('/dashboard', missing[0]?.tab);
              }}
            >
              Finish it first
            </Button>
            <Button variant="primary" onClick={() => void setPublished(true)}>
              Publish as it is
            </Button>
          </>
        }
      />
    </>
  );
}

// Sticks to the top of every dashboard page: whether your work is saved, and the publishing
// controls with the public link.
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-page/95 px-4 py-2.5 backdrop-blur">
      <p className="font-semibold lg:hidden">Portfolio Generator</p>
      <SaveIndicator />
      <div className="ms-auto flex flex-wrap items-center gap-x-5 gap-y-2">
        <PublishControls />
      </div>
    </header>
  );
}
