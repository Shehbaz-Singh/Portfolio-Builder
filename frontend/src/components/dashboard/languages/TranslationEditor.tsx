'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  MAX_ENTRIES_PER_SAVE,
  SUGGESTIONS_PER_DAY,
  languageOf,
  type MyLanguages,
  type MyPost,
  type StoredTranslation,
  ERROR_CODES,
} from '@parichay/shared';
import { ApiError, api } from '@/lib/client-api';
import { buildGroups, fieldKey, type FieldSpec } from '@/lib/translation-fields';
import { Badge, Button, ErrorText, Skeleton, Tabs } from '../../ui';
import { useAutosave } from '../autosave';
import { errorText, useEditor } from '../editor-context';
import { useAiProvider } from './ai-info';
import { LanguageProgress } from './LanguageProgress';
import { TranslationField, type SuggestApi, type SuggestResult } from './TranslationField';

type Values = Record<string, StoredTranslation>;

const toValues = (entries: StoredTranslation[]): Values =>
  Object.fromEntries(
    entries.filter((e) => e.value.trim() !== '').map((e) => [fieldKey(e), e] as const),
  );

// The translation editor: a switcher for the language, then every text of the profile in the order
// of the page. The selected language is shared with the live preview.
export function TranslationEditor({
  languages,
  refresh,
}: {
  languages: MyLanguages | null;
  refresh: () => Promise<void>;
}) {
  const { profile, previewLocale, setPreviewLocale } = useEditor();
  const locales = profile.locales;
  const locale = locales.includes(previewLocale) ? previewLocale : locales[0];
  // The preview starts on the main language; while translating, it follows the language being edited.
  useEffect(() => {
    if (locale && locale !== previewLocale) setPreviewLocale(locale);
  }, [locale, previewLocale, setPreviewLocale]);
  if (locales.length === 0) {
    return (
      <p className="text-sm text-muted">
        Add a language above, and its texts will be listed here to translate.
      </p>
    );
  }
  return (
    <Tabs
      label="Language to translate"
      idBase="translate"
      tabs={locales.map((code) => ({ id: code, label: languageOf(code).name }))}
      value={locale}
      onChange={setPreviewLocale}
    >
      <LocaleLoader key={locale} locale={locale} languages={languages} refresh={refresh} />
    </Tabs>
  );
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; values: Values };

// Fetches the saved translations of one language, then shows the form. It is keyed by the
// language, so leaving a language sends any edit still waiting before the next one opens.
function LocaleLoader({
  locale,
  languages,
  refresh,
}: {
  locale: string;
  languages: MyLanguages | null;
  refresh: () => Promise<void>;
}) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api<{ entries: StoredTranslation[] }>(`/profile/me/translations/${locale}`, {
      signal: controller.signal,
    }).then(
      ({ entries }) => setState({ status: 'ready', values: toValues(entries) }),
      (err) => {
        if (!controller.signal.aborted) setState({ status: 'error', message: errorText(err) });
      },
    );
    return () => controller.abort();
  }, [locale, attempt]);

  if (state.status === 'loading') {
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-muted">
          Loading {languageOf(locale).name} texts…
        </p>
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="space-y-2">
        <ErrorText>{state.message}</ErrorText>
        <Button
          onClick={() => {
            setState({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  return (
    <LocaleForm
      locale={locale}
      initial={state.values}
      status={languages?.languages.find((l) => l.locale === locale)}
      refresh={refresh}
    />
  );
}

function LocaleForm({
  locale,
  initial,
  status,
  refresh,
}: {
  locale: string;
  initial: Values;
  status: MyLanguages['languages'][number] | undefined;
  refresh: () => Promise<void>;
}) {
  const { profile, setTranslations } = useEditor();
  const { provider, ready } = useAiProvider();
  const [values, setValues] = useState<Values>(initial);
  const saved = useRef<Values>(initial);
  const latest = useRef<Values>(initial);
  const [saveError, setSaveError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const noteId = useId();
  const target = languageOf(locale);
  const groups = useMemo(() => buildGroups(profile), [profile]);

  useEffect(() => {
    latest.current = values;
    // The live preview shows what is typed, saved or not.
    setTranslations(locale, Object.values(values));
  }, [values, locale, setTranslations]);

  // Saves what differs from the server's copy: new and changed texts, and removals (an empty value
  // deletes a translation), at most 100 a request. It is the same autosave the other steps use, so
  // the top bar shows its state and leaving with something unsaved asks first.
  useAutosave({
    key: JSON.stringify(values),
    run: async () => {
      const sent = latest.current;
      const changes: StoredTranslation[] = [];
      for (const [key, entry] of Object.entries(sent)) {
        const before = saved.current[key];
        if (!before || before.value !== entry.value || before.needsReview !== entry.needsReview) {
          changes.push(entry);
        }
      }
      for (const [key, entry] of Object.entries(saved.current)) {
        if (!sent[key]) changes.push({ ...entry, value: '', needsReview: false });
      }
      try {
        for (let at = 0; at < changes.length; at += MAX_ENTRIES_PER_SAVE) {
          await api(`/profile/me/translations/${locale}`, {
            method: 'PUT',
            body: { entries: changes.slice(at, at + MAX_ENTRIES_PER_SAVE) },
          });
        }
      } catch (err) {
        setSaveError(errorText(err));
        return 'failed';
      }
      saved.current = sent;
      setSaveError('');
      if (changes.length > 0) void refresh();
      return 'saved';
    },
  });

  // Typing sets the text and clears "needs review"; an empty text removes the translation.
  const setText = useCallback((spec: FieldSpec, value: string, needsReview: boolean) => {
    const key = fieldKey(spec);
    setValues((all) => {
      if (value.trim() === '') {
        if (!all[key]) return all;
        const rest = { ...all };
        delete rest[key];
        return rest;
      }
      return {
        ...all,
        [key]: {
          entityType: spec.entityType,
          entityId: spec.entityId,
          field: spec.field,
          value,
          needsReview,
        },
      };
    });
  }, []);

  const request = useCallback(
    async (spec: FieldSpec): Promise<SuggestResult> => {
      try {
        const { value } = await api<{ value: string }>('/profile/me/translations/suggest', {
          method: 'POST',
          body: {
            locale,
            entityType: spec.entityType,
            entityId: spec.entityId,
            field: spec.field,
          },
        });
        return { value };
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === ERROR_CODES.SUGGESTIONS_UNAVAILABLE) setUnavailable(true);
          if (err.code === ERROR_CODES.SUGGESTION_LIMIT) setLimitMessage(err.message);
        }
        return { error: errorText(err) };
      }
    },
    [locale],
  );

  const enabled = provider !== null && !unavailable && !limitMessage;
  const suggest = useMemo<SuggestApi>(
    () => ({ enabled, noteId, request }),
    [enabled, noteId, request],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="type-section">
          <span lang={target.code} dir={target.dir}>
            {target.nativeName}
          </span>{' '}
          <span className="text-muted">({target.name})</span>
        </h3>
        {status && <LanguageProgress status={status} />}
        <div id={noteId} className="text-sm text-muted">
          {!ready ? null : provider === null || unavailable ? (
            <p>
              Translation suggestions are not available right now. You can still write the
              translations yourself.
            </p>
          ) : limitMessage ? (
            <p>{limitMessage}</p>
          ) : (
            <p>
              Suggest translation sends the original text of that one field to {provider}, an AI
              service, which writes a suggestion. Nothing is saved until you accept it or edit it
              yourself. You can ask for {SUGGESTIONS_PER_DAY} suggestions a day.
            </p>
          )}
        </div>
        <ErrorText>{saveError}</ErrorText>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted">
          There is nothing to translate yet. Write your tagline and about on the Profile page first.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`tg-${group.id}`} className="space-y-3">
          <h3 id={`tg-${group.id}`} className="type-section">
            {group.title}
          </h3>
          {group.note && <p className="text-sm text-muted">{group.note}</p>}
          <ul className="space-y-3">
            {group.cards.map((card) => (
              <li key={card.key} className="space-y-4 rounded-box border border-line p-card-sm">
                {card.heading && (
                  <p className="text-sm font-semibold break-words">{card.heading}</p>
                )}
                {card.fields.map((spec) =>
                  spec.lazyPostId ? (
                    <PostBodyField
                      key={fieldKey(spec)}
                      spec={spec}
                      value={values[fieldKey(spec)]}
                      locale={locale}
                      sourceLocale={profile.defaultLocale}
                      onChange={setText}
                      suggest={suggest}
                    />
                  ) : (
                    <TranslationField
                      key={fieldKey(spec)}
                      spec={spec}
                      value={values[fieldKey(spec)]?.value ?? ''}
                      needsReview={values[fieldKey(spec)]?.needsReview ?? false}
                      locale={locale}
                      sourceLocale={profile.defaultLocale}
                      onChange={setText}
                      suggest={suggest}
                    />
                  ),
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

type BodyState =
  | { status: 'closed' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; text: string };

// A post's body is only in the single-post request, so it is fetched when the owner asks for it.
function PostBodyField({
  spec,
  value,
  locale,
  sourceLocale,
  onChange,
  suggest,
}: {
  spec: FieldSpec;
  value: StoredTranslation | undefined;
  locale: string;
  sourceLocale: string;
  onChange: (spec: FieldSpec, value: string, needsReview: boolean) => void;
  suggest: SuggestApi;
}) {
  const [body, setBody] = useState<BodyState>({ status: 'closed' });
  const target = languageOf(locale);
  const withSource = useMemo(
    () => ({ ...spec, source: body.status === 'ready' ? body.text : null }),
    [spec, body],
  );

  async function open() {
    setBody({ status: 'loading' });
    try {
      const post = await api<MyPost>(`/profile/me/posts/${spec.lazyPostId}`);
      setBody({ status: 'ready', text: post.body ?? '' });
    } catch (err) {
      setBody({ status: 'error', message: errorText(err) });
    }
  }

  if (body.status === 'ready' && body.text.trim()) {
    return (
      <TranslationField
        spec={withSource}
        value={value?.value ?? ''}
        needsReview={value?.needsReview ?? false}
        locale={locale}
        sourceLocale={sourceLocale}
        onChange={onChange}
        suggest={suggest}
      />
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">
          {spec.label} in {target.name}
        </p>
        {value && (
          <Badge tone={value.needsReview ? 'warning' : 'accent'}>
            {value.needsReview ? 'Needs review' : 'Translated'}
          </Badge>
        )}
      </div>
      {body.status === 'ready' ? (
        <p className="text-sm text-muted">This post has no body text to translate.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Posts can be long, so the original text is loaded when you ask for it.
          </p>
          <Button size="sm" loading={body.status === 'loading'} onClick={() => void open()}>
            Show the body to translate
          </Button>
        </>
      )}
      <div role="status" aria-live="polite" className="text-sm">
        {body.status === 'loading' && <p className="text-muted">Loading the post…</p>}
        {body.status === 'error' && <p className="text-danger">{body.message}</p>}
      </div>
    </div>
  );
}
