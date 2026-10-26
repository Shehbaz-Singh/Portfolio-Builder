'use client';

import { useRouter } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import type { MyProfile } from '@portfolio/shared';
import { api } from '@/lib/client-api';
import { useLoad } from '@/lib/hooks';
import { Button } from '../ui';
import { EditorProvider, useEditor } from './editor-context';
import { Preview } from './Preview';
import { PublishPanel } from './PublishPanel';
import { LoadFailed, Loading } from './screens';
import { AboutStep } from './steps/AboutStep';
import { BasicsStep } from './steps/BasicsStep';
import { CustomSectionsStep } from './steps/CustomSectionsStep';
import { EducationStep } from './steps/EducationStep';
import { ImportBanner, ImportStep } from './steps/ImportStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { ProjectsStep } from './steps/ProjectsStep';
import { SectionsStep } from './steps/SectionsStep';
import { SkillsStep } from './steps/SkillsStep';

interface Step {
  id: string;
  label: string;
  Component: ComponentType<{ goTo: (stepId: string) => void }>;
}

// "Import resume" comes first but is not numbered: it is an optional shortcut, not a step.
const STEPS: Step[] = [
  { id: 'import', label: 'Import resume', Component: ImportStep },
  { id: 'basics', label: 'Basics', Component: BasicsStep },
  { id: 'about', label: 'About', Component: AboutStep },
  { id: 'skills', label: 'Skills', Component: SkillsStep },
  { id: 'experience', label: 'Experience', Component: ExperienceStep },
  { id: 'projects', label: 'Projects', Component: ProjectsStep },
  { id: 'education', label: 'Education', Component: EducationStep },
  { id: 'custom', label: 'Custom sections', Component: CustomSectionsStep },
  { id: 'sections', label: 'Sections', Component: SectionsStep },
];

const loadProfile = (signal: AbortSignal) => api<MyProfile>('/profile/me', { signal });

function Header() {
  const router = useRouter();
  const { hasUnsaved } = useEditor();
  const confirmLeave = () =>
    !hasUnsaved() || window.confirm('You have unsaved changes. Leave without saving them?');

  async function logOut() {
    if (!confirmLeave()) return;
    await api('/auth/logout', { method: 'POST', redirectOn401: false }).catch(() => {});
    window.location.assign('/login'); // a full load, so no profile data lingers in memory
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h1 className="font-semibold">Your portfolio</h1>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => confirmLeave() && router.push('/dashboard/settings')}
        >
          Settings
        </Button>
        <Button variant="ghost" onClick={logOut}>
          Log out
        </Button>
      </div>
    </header>
  );
}

// A brand-new profile has only a name. Those people start on the resume import.
const isBlank = (p: MyProfile) =>
  !p.about &&
  !p.tagline &&
  !p.location &&
  !p.avatarUrl &&
  [p.links, p.skills, p.experience, p.projects, p.education].every((list) => list.length === 0);

function Workspace() {
  const { hasUnsaved, profile } = useEditor();
  const [stepId, setStepId] = useState(() => (isBlank(profile) ? 'import' : 'basics'));
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
      <PublishPanel onFix={goTo} />
      <ImportBanner />
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <div className={`min-w-0 ${showPreview ? 'hidden lg:block' : ''}`}>
          <nav aria-label="Editor steps" className="mb-6 flex flex-wrap gap-1">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                aria-current={step.id === stepId ? 'step' : undefined}
                onClick={() => goTo(step.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                  step.id === stepId ? 'bg-accent text-on-accent' : 'hover:bg-surface'
                }`}
              >
                {i === 0 ? step.label : `${i}. ${step.label}`}
              </button>
            ))}
          </nav>
          <Component goTo={goTo} />
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

  if (state.status === 'loading') return <Loading label="Loading your portfolio…" />;
  if (state.status === 'error') {
    return <LoadFailed title="We couldn't load your portfolio" error={state.error} retry={retry} />;
  }
  return (
    <EditorProvider initial={state.data}>
      <Workspace />
    </EditorProvider>
  );
}
