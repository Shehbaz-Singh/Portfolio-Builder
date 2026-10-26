'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  FormProvider,
  get,
  useFormContext,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { showApiError } from '@/lib/form';
import { Button, ErrorText, SlowNotice, inputClass } from './ui';

// Form building blocks. <Form> provides the form to the fields below it through context, so
// a field only needs its `name`.

interface FormProps<TIn extends FieldValues, TOut> {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: (values: TOut) => Promise<void>;
  // Error codes that belong to one field, for example { SLUG_TAKEN: 'slug' }.
  codeFields?: Record<string, string>;
  submitLabel: string;
  danger?: boolean; // styles the submit button as a destructive action
  onCancel?: () => void;
  children: ReactNode;
}

export function Form<TIn extends FieldValues, TOut>({
  form,
  onSubmit,
  codeFields,
  submitLabel,
  danger,
  onCancel,
  children,
}: FormProps<TIn, TOut>) {
  const { isSubmitting, errors } = form.formState;
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (err) {
      showApiError(form, err, codeFields as never);
    }
  });

  return (
    <FormProvider {...(form as unknown as UseFormReturn<FieldValues>)}>
      <form noValidate onSubmit={submit} className="space-y-4">
        {children}
        <ErrorText>{errors.root?.server?.message}</ErrorText>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
        <SlowNotice pending={isSubmitting} />
      </form>
    </FormProvider>
  );
}

function useField(name: string) {
  const id = useId();
  const { register, formState } = useFormContext();
  // Array fields (like tags) report errors per element; show the first one.
  const found = get(formState.errors, name);
  const error = (Array.isArray(found) ? found.find(Boolean) : found)?.message as string | undefined;
  return { id, error, register };
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-note`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-note`} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldProps = { name: string; label: string; hint?: string };

export function TextField({
  name,
  label,
  hint,
  ...input
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        {...input}
        {...register(name)}
      />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  hint,
  rows = 4,
  maxLength,
}: FieldProps & { rows?: number; maxLength?: number }) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        className={`${inputClass} resize-y`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        {...register(name)}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
}: FieldProps & { options: { value: string; label: string }[] }) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error}>
      <select id={id} className={inputClass} {...register(name)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  ...input
}: Omit<FieldProps, 'hint'> & Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'>) {
  const { id, register } = useField(name);
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-4 rounded border-line accent-accent"
        {...input}
        {...register(name)}
      />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}
