'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckboxField, TextField } from '../form-fields';

// Month inputs hold "YYYY-MM"; that is also what the API's date schema reads.
export const toMonth = (iso?: string | null) => (iso ? iso.slice(0, 7) : '');

export interface DateRangeValues {
  startDate: string;
  endDate: string;
  current: boolean; // "present": the end date is left open
}

// Start and end dates for jobs and degrees. Ticking the box clears and locks the end date.
export function DateRangeFields({ presentLabel }: { presentLabel: string }) {
  const { control, setValue } = useFormContext<DateRangeValues>();
  const current = useWatch({ control, name: 'current' });

  useEffect(() => {
    if (current) setValue('endDate', '', { shouldDirty: true });
  }, [current, setValue]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField name="startDate" label="Start" type="month" placeholder="YYYY-MM" />
      <div className="space-y-2">
        <TextField
          name="endDate"
          label="End"
          type="month"
          placeholder="YYYY-MM"
          disabled={current}
        />
        <CheckboxField name="current" label={presentLabel} />
      </div>
    </div>
  );
}
