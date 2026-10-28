'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Switch, buttonStyles } from '../../ui';
import { useEditor } from '../editor-context';

// Whether the public page offers a "Download resume" PDF, made from what is on the page (links and
// sections you have hidden are left out). The switch saves at once; the preview shows the file
// visitors get, once the page is published.
export function ResumeCard() {
  const { profile, saveFields } = useEditor();
  const [saving, setSaving] = useState(false);
  const on = profile.resumeEnabled;

  async function toggle() {
    setSaving(true);
    try {
      await saveFields({ resumeEnabled: !on });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-card border border-line p-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Offer a resume download</p>
          <p className="text-xs text-muted">
            Adds a “Download resume” button to your page. The PDF is made from your page, in your
            theme’s look: your photo, the sections you show (in your order), approved testimonials
            and writing, and only the links you show. Hidden sections and links are left out.
          </p>
        </div>
        <Switch
          checked={on}
          label="Offer a resume download on my page"
          disabled={saving}
          onClick={toggle}
        />
      </div>
      {on &&
        (profile.published ? (
          <a
            href={`/${profile.slug}/resume.pdf?view`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'secondary' })}
          >
            <FileDown aria-hidden="true" className="size-4" />
            Preview resume (PDF)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <p className="rounded-control bg-surface px-3 py-2 text-sm text-muted">
            Publish your page to preview the PDF. Visitors can download it once the page is live.
          </p>
        ))}
    </div>
  );
}
