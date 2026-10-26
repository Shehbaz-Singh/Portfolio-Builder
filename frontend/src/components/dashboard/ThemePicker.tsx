'use client';

import { useFormContext } from 'react-hook-form';
import { THEME_OPTIONS } from '../themes';

// Radio cards bound to the form's `theme` field. With one theme it is a single selected card;
// registering a new theme in components/themes/index.ts adds a card here automatically.
export function ThemePicker() {
  const { register } = useFormContext();

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Theme</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_OPTIONS.map((theme) => (
          <label
            key={theme.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3 has-checked:border-indigo-600 has-checked:bg-indigo-50 has-focus-visible:outline-2 has-focus-visible:outline-indigo-600 dark:border-slate-700 dark:has-checked:border-indigo-400 dark:has-checked:bg-indigo-950"
          >
            <input
              type="radio"
              value={theme.id}
              className="mt-1 accent-indigo-600"
              {...register('theme')}
            />
            <span>
              <span className="block text-sm font-medium">{theme.label}</span>
              <span className="block text-xs text-slate-600 dark:text-slate-400">
                {theme.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
