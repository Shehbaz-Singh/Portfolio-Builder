'use client';

import { useState } from 'react';
import type { MyProfile } from '@portfolio/shared';
import { ApiError, api } from '@/lib/client-api';
import { useLoad, useSlow } from '@/lib/hooks';
import { Button } from '../ui';
import { EditorProvider, errorText, useEditor } from './editor-context';
import { Preview } from './Preview';
import { AboutStep } from './steps/AboutStep';
import { BasicsStep } from './steps/BasicsStep';
import { EducationStep } from './steps/EducationStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { ProjectsStep } from './steps/ProjectsStep';
import { SkillsStep } from './steps/SkillsStep';

const STEPS = [
  { id: 'basics', label: 'Basics', Component: BasicsStep },
  { id: 'about', label: 'About', Component: AboutStep },
  { id: 'skills', label: 'Skills', Component: SkillsStep },
  { id: 'experience', label: 'Experience', Component: ExperienceStep },
  { id: 'projects', label: 'Projects', Component: ProjectsStep },
  { id: 'education', label: 'Education', Component: EducationStep },
];

const loadProfile = (signal: AbortSignal) => api<MyProfile>('/profile/me', { signal });

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </main>
  );
}

function Loading() {
  const slow = useSlow(true);
  return (
    <Centered>
      <div
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
      />
      <p role="status" className="font-medium">
        {slow ? 'Waking up the server…' : 'Loading your portfolio…'}
      </p>
      {slow && (
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
          The server sleeps when nobody has used it for a while. This can take up to a minute the
          first time, and then it is fast again.
        </p>
      )}
    </Centered>
  );
}

function LoadFailed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Centered>
      <h1 className="text-2xl font-bold tracking-tight">We couldn&apos;t load your portfolio</h1>
      <div className="max-w-sm text-slate-600 dark:text-slate-400">
        <p>{error instanceof ApiError ? error.message : 'Something went wrong.'}</p>
        <p>Everything you saved earlier is safe.</p>
      </div>
      <Button variant="primary" onClick={retry}>
        Try again
      </Button>
    </Centered>
  );
}

function Header() {
  const { profile, update, notify, hasUnsaved } = useEditor();
  const [publishing, setPublishing] = useState(false);

  async function setPublished(published: boolean) {
    setPublishing(true);
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
      setPublishing(false);
    }
  }

  async function logOut() {
    if (hasUnsaved() && !window.confirm('You have unsaved changes. Log out anyway?')) return;
    await api('/auth/logout', { method: 'POST', redirectOn401: false }).catch(() => {});
    window.location.assign('/login'); // a full load, so no profile data lingers in memory
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div>
        <h1 className="font-semibold">Your portfolio</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {profile.published ? (
            <>
              Live at{' '}
              <a
                href={`/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-700 underline dark:text-indigo-400"
              >
                /{profile.slug}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </>
          ) : (
            'Not published yet. Only you can see it.'
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant={profile.published ? 'secondary' : 'primary'}
          disabled={publishing}
          onClick={() => setPublished(!profile.published)}
        >
          {publishing ? 'Working…' : profile.published ? 'Unpublish' : 'Publish'}
        </Button>
        <Button variant="ghost" onClick={logOut}>
          Log out
        </Button>
      </div>
    </header>
  );
}

function Workspace() {
  const { hasUnsaved } = useEditor();
  const [stepId, setStepId] = useState(STEPS[0].id);
  // Below the lg breakpoint the form and the preview do not fit side by side.
  const [showPreview, setShowPreview] = useState(false);
  const { Component } = STEPS.find((s) => s.id === stepId) ?? STEPS[0];

  function goTo(id: string) {
    if (id === stepId) return;
    if (
      hasUnsaved() &&
      !window.confirm('You have unsaved changes. Leave this step and lose them?')
    ) {
      return;
    }
    setStepId(id);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Header />
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <div className={`min-w-0 ${showPreview ? 'hidden lg:block' : ''}`}>
          <nav aria-label="Editor steps" className="mb-6 flex gap-1 overflow-x-auto pb-1">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                aria-current={step.id === stepId ? 'step' : undefined}
                onClick={() => goTo(step.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  step.id === stepId
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {i + 1}. {step.label}
              </button>
            ))}
          </nav>
          <Component />
        </div>

        <div
          className={`${showPreview ? '' : 'hidden'} min-w-0 lg:sticky lg:top-4 lg:block lg:self-start`}
        >
          <Preview />
        </div>
      </div>

      <div className="fixed right-4 bottom-4 lg:hidden">
        <Button variant="primary" className="shadow-lg" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? 'Back to editing' : 'Preview'}
        </Button>
      </div>
    </div>
  );
}

export function Editor() {
  const { state, retry } = useLoad(loadProfile);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadFailed error={state.error} retry={retry} />;
  return (
    <EditorProvider initial={state.data}>
      <Workspace />
    </EditorProvider>
  );
}
