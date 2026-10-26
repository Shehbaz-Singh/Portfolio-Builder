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
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              value={theme.id}
              className="mt-1 accent-accent"
              {...register('theme')}
            />
            <span>
              <span className="block text-sm font-medium">{theme.label}</span>
              <span className="block text-xs text-muted">{theme.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
