'use client';

import type { FieldValues } from 'react-hook-form';
import { Form } from '../form-fields';
import { useReportDirty } from './editor-context';

// <Form> that also tells the editor when it holds unsaved edits.
export function EditorForm<TIn extends FieldValues, TOut>(
  props: Parameters<typeof Form<TIn, TOut>>[0],
) {
  useReportDirty(props.form.formState.isDirty);
  return <Form {...props} />;
}
