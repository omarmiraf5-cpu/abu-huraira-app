/**
 * Helpers for working with masjid prayer-time strings in a fixed timezone.
 *
 * Muslimoon returns wall-clock strings that are already in the masjid's local
 * timezone (e.g. "1:30 PM"), plus a few non-clock values such as
 * "Sunset" (Maghrib adhan) and "+5 mins" (Maghrib iqamah, relative to adhan).
 */

/** Approximate location of Abu Huraira Center (North York, Toronto). Used only to estimate sunset. */
export const AHC_COORDS = { latitude: 43.7745, longitude: -79.3346 } as const;

export type ZonedNow = {
  /** YYYY-MM-DD in the target timezone */
  date: string;
  year: number;
  month: number; // 1-12
  day: number;
  /** Minutes since local midnight in the target timezone */
  minutes: number;
  /** 0 = Sunday … 5 = Friday */
  weekday: number;
};

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Current date/time as wall-clock values in `timeZone`. */
export function zonedNow(timeZone: string, at: Date = new Date()): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    year,
    month,
    day,
    minutes: hour * 60 + minute,
    weekday: WEEKDAYS[get('weekday')] ?? 0,
  };
}

/** Parse "6:00 AM", "1:30 pm", "13:45" → minutes since midnight. Returns null for non-clock values. */
export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp]\.?\s*[Mm]\.?)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.replace(/[.\s]/g, '').toUpperCase();
  if (minute > 59 || hour > 23) return null;
  if (meridiem === 'AM') {
    if (hour === 12) hour = 0;
  } else if (meridiem === 'PM') {
    if (hour < 12) hour += 12;
  } else if (!m[2]) {
    return null; // a bare number like "5" is not a time
  }
  return hour * 60 + minute;
}

/** Parse "+5 mins", "+10 min", "+15" → offset minutes. */
export function parseOffset(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.trim().match(/^\+\s*(\d{1,3})\s*(m|min|mins|minutes)?\.?$/i);
  return m ? Number(m[1]) : null;
}

export function isSunsetLabel(value: string | null | undefined): boolean {
  return !!value && /^sunset$/i.test(value.trim());
}

/** Format minutes since midnight as "7:05 PM". */
export function formatClock(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** "1h 05m" / "12m" */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return h > 0 ? `${h}h ${rest.toString().padStart(2, '0')}m` : `${rest}m`;
}

/**
 * Estimated sunset (NOAA solar-position approximation, ~1–2 min accuracy)
 * for the given calendar date, returned as minutes since midnight in `timeZone`.
 */
export function estimateSunsetMinutes(
  year: number,
  month: number,
  day: number,
  timeZone: string,
  coords: { latitude: number; longitude: number } = AHC_COORDS,
): number | null {
  const rad = Math.PI / 180;
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000) + 1;
  // Fractional year (radians) at ~noon
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (12 - 12) / 24);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const lat = coords.latitude * rad;
  const cosHa =
    Math.cos(90.833 * rad) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null; // polar day/night
  const ha = Math.acos(cosHa) / rad;
  const sunsetUtcMinutes = 720 - 4 * (coords.longitude - ha) - eqTime;
  const sunsetUtc = new Date(Date.UTC(year, month - 1, day) + sunsetUtcMinutes * 60000);
  return zonedNow(timeZone, sunsetUtc).minutes;
}

/**
 * The real instant for a wall-clock time in `timeZone` (DST-safe).
 * e.g. (2026, 10, 1, 17*60, 'America/Toronto') → 2026-10-01T21:00:00Z.
 */
export function zonedTimeToUtc(year: number, month: number, day: number, minutes: number, timeZone: string): Date {
  const target = Date.UTC(year, month - 1, day, 0, minutes);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const z = zonedNow(timeZone, new Date(guess));
    const seen = Date.UTC(z.year, z.month - 1, z.day, 0, z.minutes);
    if (seen === target) break;
    guess += target - seen;
  }
  return new Date(guess);
}

/** Calendar day `offset` days after (year, month, day), with its weekday (0 = Sunday). */
export function addDays(year: number, month: number, day: number, offset: number) {
  const d = new Date(Date.UTC(year, month - 1, day + offset));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const dd = d.getUTCDate();
  return {
    year: y,
    month: m,
    day: dd,
    weekday: d.getUTCDay(),
    date: `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
  };
}

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "Every Sunday" / "Sundays" / "Sun" → 0; null when no weekday is named. */
export function parseWeekday(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = value.toLowerCase();
  const i = WEEKDAY_NAMES.findIndex((w) => new RegExp(`\\b(${w}|${w.slice(0, 3)})s?\\b`).test(v));
  return i >= 0 ? i : null;
}
