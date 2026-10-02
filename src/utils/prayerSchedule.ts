/**
 * Prayer schedule logic shared by the Home and Prayer screens.
 * (Moved out of app/(tabs)/prayer.tsx unchanged, plus display-only extras
 * on NextPrayer: `kind`, `time`, `targetMin`.)
 */
import type { PrayerTime } from '@/src/api/muslimoon';
import {
  estimateSunsetMinutes,
  formatClock,
  formatDuration,
  isSunsetLabel,
  parseClock,
  parseOffset,
  type ZonedNow,
} from '@/src/utils/prayerTime';
import { locale } from '@/src/theme/tokens';

/** All times are displayed and compared in the masjid's timezone. */
export const TIMEZONE = locale.timezone; // America/Toronto

export type ResolvedPrayer = PrayerTime & {
  adhanMin: number | null;
  iqamahMin: number | null;
  /** Estimated clock time when the API gives a label ("Sunset", "+5 mins") */
  adhanApprox?: string;
  iqamahApprox?: string;
};

export type NextPrayer = {
  key: string;
  name: string;
  tomorrow: boolean;
  label: string; // e.g. "Iqamah in 25m"
  /** Which moment the countdown targets */
  kind?: 'Adhan' | 'Iqamah' | 'Ends';
  /** Display time of that moment (keeps the ≈ marker for estimates) */
  time?: string;
  /** Target in minutes since today's local midnight (> 1440 = tomorrow) */
  targetMin?: number;
};

export function resolvePrayer(p: PrayerTime, now: ZonedNow): ResolvedPrayer {
  let adhanMin = parseClock(p.adhan);
  let adhanApprox: string | undefined;
  if (adhanMin === null && isSunsetLabel(p.adhan)) {
    adhanMin = estimateSunsetMinutes(now.year, now.month, now.day, TIMEZONE);
    if (adhanMin !== null) adhanApprox = `≈ ${formatClock(adhanMin)}`;
  }
  let iqamahMin = parseClock(p.iqamah);
  let iqamahApprox: string | undefined;
  if (iqamahMin === null) {
    const offset = parseOffset(p.iqamah);
    if (offset !== null && adhanMin !== null) {
      iqamahMin = adhanMin + offset;
      iqamahApprox = `${adhanApprox ? '≈ ' : ''}${formatClock(iqamahMin)}`;
    }
  }
  return { ...p, adhanMin, iqamahMin, adhanApprox, iqamahApprox };
}

export function computeNext(
  daily: ResolvedPrayer[],
  jummah: ResolvedPrayer[],
  now: ZonedNow,
): NextPrayer | null {
  // On Fridays, Jumu'ah takes Dhuhr's place in the sequence.
  const sequence =
    now.weekday === 5 && jummah[0]
      ? daily.map((p) => (p.key === 'dhuhr' ? jummah[0] : p))
      : daily;

  for (const p of sequence) {
    const times = [p.adhanMin, p.iqamahMin].filter((t): t is number => t !== null);
    if (times.length === 0) continue;
    const end = Math.max(...times);
    if (end <= now.minutes) continue;
    if (p.adhanMin !== null && p.adhanMin > now.minutes) {
      return {
        key: p.key,
        name: p.name,
        tomorrow: false,
        label: `Adhan in ${formatDuration(p.adhanMin - now.minutes)}`,
        kind: 'Adhan',
        time: p.adhanApprox ?? p.adhan ?? formatClock(p.adhanMin),
        targetMin: p.adhanMin,
      };
    }
    if (p.iqamahMin !== null && p.iqamahMin > now.minutes) {
      return {
        key: p.key,
        name: p.name,
        tomorrow: false,
        label: `Iqamah in ${formatDuration(p.iqamahMin - now.minutes)}`,
        kind: 'Iqamah',
        time: p.iqamahApprox ?? p.iqamah ?? formatClock(p.iqamahMin),
        targetMin: p.iqamahMin,
      };
    }
    return {
      key: p.key,
      name: p.name,
      tomorrow: false,
      label: `in ${formatDuration(end - now.minutes)}`,
      kind: 'Ends',
      time: formatClock(end),
      targetMin: end,
    };
  }

  // After Isha: next is tomorrow's Fajr (assumes similar time tomorrow).
  const fajr = daily.find((p) => p.key === 'fajr') ?? daily[0];
  if (!fajr) return null;
  const start = fajr.adhanMin ?? fajr.iqamahMin;
  return {
    key: fajr.key,
    name: fajr.name,
    tomorrow: true,
    label: start !== null ? `Tomorrow · in ${formatDuration(1440 - now.minutes + start)}` : 'Tomorrow',
    kind: fajr.adhanMin !== null ? 'Adhan' : 'Iqamah',
    time: (fajr.adhanMin !== null ? fajr.adhan : fajr.iqamah) ?? undefined,
    targetMin: start !== null ? 1440 + start : undefined,
  };
}

/**
 * Fraction (0–1) of the gap between the previous prayer and the next target
 * that has elapsed. Display-only; returns null when it can't be worked out.
 */
export function progressToNext(
  daily: ResolvedPrayer[],
  next: NextPrayer | null,
  now: ZonedNow,
): number | null {
  if (!next || next.targetMin === undefined) return null;
  const starts = daily
    .map((p) => p.adhanMin ?? p.iqamahMin)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);
  if (starts.length === 0) return null;
  const nowMin = now.minutes;
  const before = starts.filter((t) => t <= nowMin);
  // Before today's first prayer, the previous one was last night's last prayer.
  const prev = before.length ? before[before.length - 1] : starts[starts.length - 1] - 1440;
  const span = next.targetMin - prev;
  if (span <= 0) return null;
  return Math.max(0, Math.min(1, (nowMin - prev) / span));
}

/** Formats a plain YYYY-MM-DD calendar date, e.g. "Fri, Oct 2". */
export function formatCalendarDate(date: string) {
  // date is a plain YYYY-MM-DD; format at noon UTC so it never shifts a day.
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
