'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_ACCENT } from '@portfolio/shared';
import { ACCENT_PRESETS, MIN_CONTRAST, accentContrast, normalizeHex } from '@/lib/color';
import { getTheme } from '@/lib/themes';
import { ErrorText, inputClass } from '../ui';

// Choose the page's accent color: 8 swatches, the browser's color picker, or a typed hex code.
// All three write the form's `accentColor` field, which the live preview shows at once. A color
// that is hard to read on the chosen theme's background gets a warning but can still be saved.
export function AccentPicker() {
  const { control, register, setValue } = useFormContext<{ accentColor: string; theme: string }>();
  const value = useWatch({ control, name: 'accentColor' });
  const theme = getTheme(useWatch({ control, name: 'theme' }));
  const hex = normalizeHex(value);
  const ratio = hex ? accentContrast(hex, theme) : null;
  const poor = ratio !== null && ratio < MIN_CONTRAST;
  const set = (next: string) =>
    setValue('accentColor', next, { shouldDirty: true, shouldValidate: true });

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Accent color</legend>

      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <label key={preset.hex} className="cursor-pointer">
            <input
              type="radio"
              name="accent-preset"
              className="peer sr-only"
              checked={hex === preset.hex}
              onChange={() => set(preset.hex)}
            />
            <span
              style={{ backgroundColor: preset.hex }}
              className="block size-8 rounded-full ring-ink ring-offset-2 ring-offset-page peer-checked:ring-2 peer-focus-visible:ring-2"
            />
            <span className="sr-only">{preset.name}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label="Pick a custom color"
          value={hex ?? DEFAULT_ACCENT}
          onChange={(e) => set(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-page p-1"
        />
        <input
          {...register('accentColor')}
          aria-label="Hex color code"
          aria-invalid={!hex}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className={`${inputClass} w-28 font-mono`}
        />
      </div>

      {/* Shown as soon as the value is not a full #RRGGBB, not only after a save attempt. */}
      <ErrorText>{hex ? undefined : 'Use a hex color like #2563eb.'}</ErrorText>
      {poor && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          This color is hard to read on the {theme.name} theme (contrast {ratio.toFixed(1)}:1; text
          needs {MIN_CONTRAST}:1). Choose a {theme.scheme === 'dark' ? 'lighter' : 'darker'} color
          so your links and tags stay readable.
        </p>
      )}
    </fieldset>
  );
}
