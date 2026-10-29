import { WEEK_DAYS, minutesOf, type WeekDay, type WorkingHours } from '@parichay/shared';
import { intlLocale } from './i18n';

// The time arithmetic of the "Working together" card. Everything goes through Intl, which knows each
// zone's rules (daylight saving, half-hour and 45-minute offsets such as India, Nepal and
// Newfoundland), so there is no table of offsets here to go out of date.

interface Fields {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: WeekDay;
}

const formats = new Map<string, Intl.DateTimeFormat>();
const WEEKDAY_NAMES: Record<string, WeekDay> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

// The calendar fields of an instant, as a clock in `timeZone` shows them.
export function zonedFields(date: Date, timeZone: string): Fields {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
    });
    formats.set(timeZone, format);
  }
  const value: Record<string, string> = {};
  for (const part of format.formatToParts(date)) value[part.type] = part.value;
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    hour: Number(value.hour) % 24, // some engines write midnight as 24
    minute: Number(value.minute),
    second: Number(value.second),
    weekday: WEEKDAY_NAMES[value.weekday] ?? 'mon',
  };
}

// Minutes the zone's clock is ahead of UTC at that moment (negative when behind): +330 for India,
// +345 for Nepal, -210 for Newfoundland in winter and -150 in summer.
export function offsetMinutes(date: Date, timeZone: string): number {
  const f = zonedFields(date, timeZone);
  const asUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// How far the owner's clock is ahead of the visitor's (negative: behind), in minutes, right now.
export const differenceMinutes = (date: Date, ownerZone: string, visitorZone: string) =>
  offsetMinutes(date, ownerZone) - offsetMinutes(date, visitorZone);

// "2026-10-30T15:42+05:30": the moment, written on the owner's clock (for <time datetime>).
export function isoInZone(date: Date, timeZone: string): string {
  const f = zonedFields(date, timeZone);
  const offset = offsetMinutes(date, timeZone);
  const abs = Math.abs(offset);
  const two = (n: number) => String(n).padStart(2, '0');
  const sign = offset < 0 ? '-' : '+';
  return `${f.year}-${two(f.month)}-${two(f.day)}T${two(f.hour)}:${two(f.minute)}${sign}${two(Math.floor(abs / 60))}:${two(abs % 60)}`;
}

// ---- formatting, in the page's language

const timeFormats = new Map<string, Intl.DateTimeFormat>();
function timeFormat(locale: string, timeZone: string) {
  const key = `${locale}|${timeZone}`;
  let format = timeFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(intlLocale(locale), {
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
    timeFormats.set(key, format);
  }
  return format;
}

// The time of day on a clock in `timeZone` ("3:42 pm").
export const formatClock = (date: Date, timeZone: string, locale: string) =>
  timeFormat(locale, timeZone).format(date);

// A time of day given as minutes since midnight ("9:00 am"), with no zone attached.
export const formatMinutes = (minutes: number, locale: string) =>
  timeFormat(locale, 'UTC').format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));

const dayFormats = new Map<string, Intl.DateTimeFormat>();
// "Monday" or "Mon", in the page's language.
export function dayName(day: WeekDay, locale: string, style: 'long' | 'short' = 'long') {
  const key = `${locale}|${style}`;
  let format = dayFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(intlLocale(locale), { weekday: style, timeZone: 'UTC' });
    dayFormats.set(key, format);
  }
  // 1 January 2024 was a Monday.
  return format.format(new Date(Date.UTC(2024, 0, 1 + WEEK_DAYS.indexOf(day))));
}

// ---- working hours

export type WorkStatus =
  | { state: 'open'; until: number } // minutes since midnight, on the owner's clock
  | { state: 'closed'; next: { day: WeekDay; today: boolean; start: number } | null };

// Whether the owner is within working hours at `date`, and if not, when they are next in.
export function workStatus(hours: WorkingHours, date: Date, timeZone: string): WorkStatus {
  const f = zonedFields(date, timeZone);
  const now = f.hour * 60 + f.minute;
  const today = WEEK_DAYS.indexOf(f.weekday);

  const current = hours[f.weekday].find(
    (range) => minutesOf(range.start) <= now && now < minutesOf(range.end),
  );
  if (current) return { state: 'open', until: minutesOf(current.end) };

  for (let ahead = 0; ahead <= 7; ahead++) {
    const day = WEEK_DAYS[(today + ahead) % 7];
    const next = hours[day].find((range) => ahead > 0 || minutesOf(range.start) > now);
    if (next)
      return { state: 'closed', next: { day, today: ahead === 0, start: minutesOf(next.start) } };
  }
  return { state: 'closed', next: null };
}

// The instant at which a clock in `timeZone` shows this date and time (the zone's own rules decide
// the offset, so it is right on either side of a daylight-saving change).
function zonedToInstant(year: number, month: number, day: number, minutes: number, zone: string) {
  const wall = Date.UTC(year, month - 1, day, 0, minutes);
  let guess = wall;
  for (let i = 0; i < 2; i++) guess = wall - offsetMinutes(new Date(guess), zone) * 60000;
  return new Date(guess);
}

export interface LocalRange {
  day: WeekDay; // the day it starts, on the visitor's clock
  start: number;
  end: number;
  endDay: WeekDay; // differs from `day` when it runs past midnight on the visitor's clock
}

// The week's ranges as the visitor's clock shows them, for the coming week from `date`.
export function hoursInZone(
  hours: WorkingHours,
  date: Date,
  ownerZone: string,
  visitorZone: string,
): LocalRange[] {
  const f = zonedFields(date, ownerZone);
  const today = WEEK_DAYS.indexOf(f.weekday);
  const out: LocalRange[] = [];
  WEEK_DAYS.forEach((day, index) => {
    const ahead = (index - today + 7) % 7;
    const base = new Date(Date.UTC(f.year, f.month - 1, f.day + ahead));
    const [y, m, d] = [base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate()];
    for (const range of hours[day]) {
      const from = zonedFields(
        zonedToInstant(y, m, d, minutesOf(range.start), ownerZone),
        visitorZone,
      );
      const to = zonedFields(zonedToInstant(y, m, d, minutesOf(range.end), ownerZone), visitorZone);
      out.push({
        day: from.weekday,
        start: from.hour * 60 + from.minute,
        end: to.hour * 60 + to.minute,
        endDay: to.weekday,
      });
    }
  });
  return out.sort(
    (a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day) || a.start - b.start,
  );
}

export const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
