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
import { Button, ErrorText, Input, Select, SlowNotice, Textarea } from './ui';

// Form building blocks. <Form> provides the form to the fields below it through context, so
// a field only needs its `name`.

interface FormProps<TIn extends FieldValues, TOut> {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: (values: TOut) => Promise<void>;
  // Error codes that belong to one field, for example { SLUG_TAKEN: 'slug' }.
  codeFields?: Record<string, string>;
  submitLabel?: string; // none: a form that saves by itself has no button
  danger?: boolean; // styles the submit button as a destructive action
  pendingLabel?: string; // the submit button while sending, "Saving…" by default
  onCancel?: () => void;
  children: ReactNode;
}

export function Form<TIn extends FieldValues, TOut>({
  form,
  onSubmit,
  codeFields,
  submitLabel,
  danger,
  pendingLabel = 'Saving…',
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
        {(submitLabel || onCancel) && (
          <div className="flex flex-wrap items-center gap-3">
            {submitLabel && (
              <Button type="submit" variant={danger ? 'danger' : 'primary'} loading={isSubmitting}>
                {isSubmitting ? pendingLabel : submitLabel}
              </Button>
            )}
            {onCancel && (
              <Button onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        )}
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
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="font-normal text-muted"> (required)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-note`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-note`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// `required` marks the field in its label and for screen readers. The form is validated by the
// shared schema, not by the browser, so this is only the indication.
type FieldProps = { name: string; label: string; hint?: string; required?: boolean };

export function TextField({
  name,
  label,
  hint,
  required,
  ...input
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <Input
        id={id}
        aria-required={required || undefined}
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
  required,
}: FieldProps & { rows?: number; maxLength?: number }) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <Textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        aria-required={required || undefined}
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
  required,
}: FieldProps & { options: { value: string; label: string }[] }) {
  const { id, error, register } = useField(name);
  return (
    <Field id={id} label={label} error={error} required={required}>
      <Select
        id={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-note` : undefined}
        {...register(name)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
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
