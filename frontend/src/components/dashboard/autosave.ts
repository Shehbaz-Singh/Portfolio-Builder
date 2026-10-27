'use client';

import { useEffect, useId, useRef } from 'react';
import { useWatch, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { showApiError } from '@/lib/form';
import { useEditor } from './editor-context';

// Saves something by itself shortly after it stops changing, and tells the top bar how it is going
// (editor-context's saveStatus). `key` stands for the current content: when it differs from what
// was last saved, a save is scheduled. `run` does the save and says how it went: "invalid" means
// the content cannot be saved yet (a form with errors), "failed" that the request did not work.
//
// Leaving the page does not lose a pending save: it goes out at once, and carries on after the
// screen is gone. Closing the tab cannot wait for it, so the browser's own warning covers that.
export type SaveResult = 'saved' | 'invalid' | 'failed';

const DELAY = 1000;

export function useAutosave({
  key,
  run,
  enabled = true,
}: {
  key: string;
  run: () => Promise<SaveResult>;
  enabled?: boolean; // off while something else (a review of imported data) is in charge of saving
}) {
  const { reportSave } = useEditor();
  const id = useId();
  const saved = useRef(key); // what the server has
  const current = useRef(key);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef(false);
  const again = useRef(false); // content changed while a request was on its way
  const mounted = useRef(true);
  const runRef = useRef(run);
  const attemptRef = useRef<() => Promise<void>>(async () => {});

  async function attempt() {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (inflight.current) {
      again.current = true;
      return;
    }
    const sent = current.current;
    if (sent === saved.current) return reportSave(id, null);

    inflight.current = true;
    reportSave(id, 'saving');
    let result: SaveResult;
    try {
      result = await runRef.current();
    } catch {
      result = 'failed';
    }
    inflight.current = false;

    if (result === 'saved') saved.current = sent;
    if (result === 'failed') return reportSave(id, 'error', () => void attemptRef.current());
    if (result === 'invalid') return reportSave(id, 'invalid');
    if (again.current || current.current !== saved.current) {
      again.current = false;
      if (!mounted.current) return attemptRef.current();
      reportSave(id, 'pending');
      timer.current = setTimeout(() => void attemptRef.current(), DELAY);
      return;
    }
    reportSave(id, null);
  }

  useEffect(() => {
    runRef.current = run;
    attemptRef.current = attempt;
  });

  // Back on after a review: whatever is in the form then is what was just saved by hand.
  useEffect(() => {
    if (enabled) saved.current = current.current;
  }, [enabled]);

  useEffect(() => {
    current.current = key;
    if (!enabled) return;
    if (key === saved.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (!inflight.current) reportSave(id, null);
      return;
    }
    reportSave(id, 'pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void attemptRef.current(), DELAY);
  }, [key, enabled, id, reportSave]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current)
        void attemptRef.current(); // send it now
      else if (!inflight.current) reportSave(id, null); // an unsaved or failed one was left behind
    };
  }, [id, reportSave]);
}

// For a react-hook-form form: saves its values (once they pass the schema) after a pause.
export function useFormAutosave<TIn extends FieldValues, TOut>(
  form: UseFormReturn<TIn, unknown, TOut>,
  save: (values: TOut) => Promise<void>,
  { enabled, codeFields }: { enabled?: boolean; codeFields?: Record<string, string> } = {},
) {
  const values = useWatch({ control: form.control });
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  useAutosave({
    key: JSON.stringify(values),
    enabled,
    run: async () => {
      let result: SaveResult = 'invalid';
      await form.handleSubmit(async (parsed) => {
        try {
          await saveRef.current(parsed);
          result = 'saved';
        } catch (err) {
          showApiError(form, err, codeFields as never);
          result = 'failed';
        }
      })();
      return result;
    },
  });
}
