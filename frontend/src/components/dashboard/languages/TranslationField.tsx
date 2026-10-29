'use client';

import { memo, useId, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { languageOf } from '@parichay/shared';
import type { FieldSpec } from '@/lib/translation-fields';
import { Badge, Button, Input, Textarea } from '../../ui';

export type SuggestResult = { value: string } | { error: string };

export interface SuggestApi {
  // Whether the button works right now; `note` (when it does not) says why, near the button.
  enabled: boolean;
  noteId: string;
  request: (spec: FieldSpec) => Promise<SuggestResult>;
}

type Suggestion =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: string }
  | { status: 'error'; message: string }
  | { status: 'done'; message: string }; // what was just done with a suggestion, to announce

// One text to translate: the original in the default language (read-only), the field for the
// translation in the target language, and the AI suggestion flow. Nothing a suggestion says is
// saved until the owner accepts it or edits it.
function TranslationFieldBase({
  spec,
  value,
  needsReview,
  locale,
  sourceLocale,
  onChange,
  suggest,
}: {
  spec: FieldSpec;
  value: string;
  needsReview: boolean;
  locale: string;
  sourceLocale: string;
  onChange: (spec: FieldSpec, value: string, needsReview: boolean) => void;
  suggest: SuggestApi;
}) {
  const id = useId();
  const target = languageOf(locale);
  const source = languageOf(sourceLocale);
  const [suggestion, setSuggestion] = useState<Suggestion>({ status: 'idle' });
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const missing = value.trim() === '';

  async function ask() {
    setSuggestion({ status: 'loading' });
    const result = await suggest.request(spec);
    setSuggestion(
      'value' in result
        ? { status: 'ready', value: result.value }
        : { status: 'error', message: result.error },
    );
  }

  const common = {
    id,
    ref: field,
    value,
    lang: target.code,
    dir: target.dir,
    maxLength: spec.rule.max,
    'aria-describedby': `${id}-source ${id}-count`,
    onChange: (e: { target: { value: string } }) => {
      if (suggestion.status === 'done') setSuggestion({ status: 'idle' });
      onChange(spec, e.target.value, false);
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {spec.label} in {target.name}
        </label>
        {missing ? (
          <Badge tone="warning">Missing</Badge>
        ) : needsReview ? (
          <>
            <Badge tone="warning">Needs review</Badge>
            <Button size="sm" onClick={() => onChange(spec, value, false)}>
              Mark as reviewed<span className="sr-only"> for {spec.label}</span>
            </Button>
          </>
        ) : (
          <Badge tone="accent">Translated</Badge>
        )}
      </div>

      <div className="rounded-control bg-surface px-3 py-2">
        <p className="text-xs font-medium text-muted">Original in {source.name}</p>
        <p
          id={`${id}-source`}
          lang={source.code}
          dir={source.dir}
          className="mt-0.5 line-clamp-6 text-sm break-words whitespace-pre-wrap"
        >
          {spec.source}
        </p>
      </div>

      {spec.rule.multiline ? (
        <Textarea {...common} rows={spec.field === 'body' ? 12 : 5} />
      ) : (
        <Input {...common} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-count`} className="text-xs text-muted">
          {value.length} of {spec.rule.max} characters
        </p>
        <Button
          ref={button}
          size="sm"
          disabled={!suggest.enabled || suggestion.status === 'loading'}
          aria-describedby={suggest.noteId}
          onClick={() => void ask()}
        >
          <Sparkles aria-hidden="true" className="size-3.5" />
          Suggest translation
          <span className="sr-only">
            {' '}
            for {spec.label} in {target.name}
          </span>
        </Button>
      </div>

      <div role="status" aria-live="polite" className="text-sm">
        {suggestion.status === 'loading' && <p className="text-muted">Getting a suggestion…</p>}
        {suggestion.status === 'done' && <p className="text-muted">{suggestion.message}</p>}
        {suggestion.status === 'error' && <p className="text-danger">{suggestion.message}</p>}
        {suggestion.status === 'ready' && (
          <p className="sr-only">A suggestion is ready. Review it below the field.</p>
        )}
      </div>

      {suggestion.status === 'ready' && (
        <div className="space-y-2 rounded-control border border-dashed border-accent/50 bg-accent-soft p-3">
          <p className="text-sm font-medium">Suggestion from AI: review before using it</p>
          <p
            lang={target.code}
            dir={target.dir}
            className="text-sm break-words whitespace-pre-wrap"
          >
            {suggestion.value}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                // Saved like any edit, but marked so it can be found and read again later.
                onChange(spec, suggestion.value, true);
                setSuggestion({
                  status: 'done',
                  message: 'Suggestion accepted. It stays marked Needs review until you edit it.',
                });
                field.current?.focus();
              }}
            >
              Accept<span className="sr-only"> suggestion</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(spec, suggestion.value, true);
                setSuggestion({
                  status: 'done',
                  message: 'Suggestion put in the field. Change it as you like.',
                });
                field.current?.focus();
              }}
            >
              Edit<span className="sr-only"> suggestion in the field</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSuggestion({ status: 'idle' });
                button.current?.focus();
              }}
            >
              Dismiss<span className="sr-only"> suggestion</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const TranslationField = memo(TranslationFieldBase);
