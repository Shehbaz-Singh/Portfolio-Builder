'use client';

import { getTheme } from '../themes';
import { useEditor } from './editor-context';

// The real theme component fed with the profile being edited, so what you see is what the
// public page will show. `zoom` shrinks it to fit beside the form while keeping the theme's
// desktop layout, and `inert` stops its links from being clickable or focusable.
export function Preview() {
  const { preview } = useEditor();
  const Theme = getTheme(preview.theme);

  return (
    <section
      aria-label="Live preview"
      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
    >
      <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Live preview
      </p>
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div inert style={{ zoom: 0.75 }}>
          <Theme profile={preview} />
        </div>
      </div>
    </section>
  );
}
