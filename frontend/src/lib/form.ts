import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Path, Resolver, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { ApiError } from './client-api';
import { PROBLEMS } from '@/lib/messages';

// zod words a blank date as "Invalid date"; say what to do instead.
const errorMap = (issue: z.ZodIssueOptionalMessage, ctx: { defaultError: string }) => ({
  message: issue.code === 'invalid_date' ? 'Enter a date like 2022-03' : ctx.defaultError,
});

// Forms hold text, the shared schemas describe API data. An emptied input is "" in the form
// but means "not provided" to the schema (optional URL, open-ended end date, ...), so blanks
// become undefined before validation. Required fields then say "Required".
const blanksToUndefined = (values: FieldValues): FieldValues =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? undefined : v]));

// react-hook-form with a shared Zod schema. `prepare` reshapes form values the schema cannot
// read as they are (for example "Go, Rust" into ["Go", "Rust"]).
export function schemaResolver<TForm extends FieldValues, S extends z.ZodTypeAny>(
  schema: S,
  prepare: (values: TForm) => FieldValues = (values) => values,
): Resolver<TForm, unknown, z.output<S>> {
  const resolve = zodResolver(
    schema as never,
    { errorMap } as never,
  ) as unknown as Resolver<FieldValues>;
  return ((values, context, options) =>
    resolve(blanksToUndefined(prepare(values)), context, options as never)) as Resolver<
    TForm,
    unknown,
    z.output<S>
  >;
}

// Shows a failed API call on the form. Field-level problems from the API's own validation go
// to their fields, known codes (like SLUG_TAKEN) go to a chosen field, the rest to the top.
export function showApiError<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, 'setError' | 'getValues'>,
  err: unknown,
  codeFields: Record<string, Path<T>> = {},
) {
  if (!(err instanceof ApiError)) {
    form.setError('root.server', { message: PROBLEMS.generic });
    return;
  }
  const field = codeFields[err.code];
  if (field) return form.setError(field, { message: err.message });

  const known = new Set(Object.keys(form.getValues()));
  const fieldIssues = err.details.filter((d) => known.has(d.path));
  if (fieldIssues.length > 0) {
    fieldIssues.forEach((d) => form.setError(d.path as Path<T>, { message: d.message }));
    return;
  }
  form.setError('root.server', { message: err.message });
}
