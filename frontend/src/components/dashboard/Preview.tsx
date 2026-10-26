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
    <section aria-label="Live preview" className="overflow-hidden rounded-2xl border border-line">
      <p className="border-b border-line bg-surface px-4 py-2 text-xs font-medium text-muted">
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
