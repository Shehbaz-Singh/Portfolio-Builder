import { z } from 'zod';

// The "availability" badge on the public page: whether the owner is looking for work, and what to
// say about it. The status picks a friendly default line; `custom` uses the owner's own words.
export const AVAILABILITY_STATUSES = [
  'open_to_work',
  'open_to_freelance',
  'open_to_collaborate',
  'custom',
] as const;
export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES);
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export const DEFAULT_AVAILABILITY_STATUS: AvailabilityStatus = 'open_to_work';
export const AVAILABILITY_MESSAGE_MAX = 140;

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  open_to_work: 'Open to new opportunities',
  open_to_freelance: 'Available for freelance projects',
  open_to_collaborate: 'Open to collaborating',
  custom: 'Available',
};

// What the badge says. A preset shows its default line, with the owner's message as extra detail.
// A custom status is the owner's own message, or a plain "Available" while they have not written one.
export function availabilityText(
  status: AvailabilityStatus,
  message: string | null | undefined,
): { label: string; detail: string | null } {
  const note = message?.trim() || null;
  return status === 'custom'
    ? { label: note ?? AVAILABILITY_LABELS.custom, detail: null }
    : { label: AVAILABILITY_LABELS[status], detail: note };
}
