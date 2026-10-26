'use client';

import { useFormContext } from 'react-hook-form';
import { THEME_LIST } from '@/lib/themes';
import { useEditor } from './editor-context';

// Radio cards bound to the form's `theme` field, one per registered theme. Each card shows the
// theme itself, drawn small with the profile being edited, so the choice is made by looking.
// Choosing one switches the live preview straight away (the form's draft carries the theme).
export function ThemePicker() {
  const { register } = useFormContext();
  const { preview } = useEditor();

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Theme</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_LIST.map((theme) => (
          <label
            key={theme.key}
            className="flex cursor-pointer flex-col gap-2 rounded-xl border border-line p-2 transition hover:bg-surface has-checked:border-accent has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input type="radio" value={theme.key} className="sr-only" {...register('theme')} />
            {/* A picture of the theme, not content: hidden from assistive technology, and inert so
                nothing in it can be clicked or focused. The ids get a prefix so they stay unique. */}
            <div
              aria-hidden="true"
              inert
              className="pointer-events-none h-40 overflow-hidden rounded-lg border border-line"
            >
              <div style={{ zoom: 0.2 }}>
                <theme.Component profile={preview} idPrefix={`pick-${theme.key}-`} />
              </div>
            </div>
            <span className="px-1 pb-1">
              <span className="block text-sm font-medium">{theme.name}</span>
              <span className="block text-xs text-muted">{theme.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
