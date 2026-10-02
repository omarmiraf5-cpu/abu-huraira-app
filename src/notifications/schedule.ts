/**
 * Reminder planning — pure functions, no native calls, so they can be tested
 * anywhere. `reminders.ts` hands the plan to expo-notifications.
 *
 * Rules
 * - Only LIVE data is ever scheduled. Sample prayer times and preview events
 *   never produce a reminder.
 * - All times are Toronto wall-clock (the masjid's), converted to real
 *   instants per day, so DST changes and travellers get the right moment.
 * - Muslimoon only publishes today's times; later days reuse those clock
 *   times (Maghrib follows each day's sunset). The plan is rebuilt every time
 *   the app opens, so it self-corrects as the masjid updates its schedule.
 * - iOS keeps at most 64 pending local notifications, so the plan is capped.
 */
import type { EventItem, PrayerTime, PrayerTimesResult } from '@/src/api/muslimoon';
import {
  addDays,
  estimateSunsetMinutes,
  formatClock,
  isSunsetLabel,
  parseClock,
  parseOffset,
  zonedNow,
  zonedTimeToUtc,
} from '@/src/utils/prayerTime';

export const MASJID_TZ = 'America/Toronto';
export const MASJID_NAME = 'Abu Huraira Center';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah';

export type NotificationPrefs = {
  prayer: {
    enabled: boolean;
    /** 'adhan' = at adhan time; 'beforeIqamah' = `lead` minutes before iqamah */
    mode: 'adhan' | 'beforeIqamah';
    lead: number;
    prayers: Record<PrayerKey, boolean>;
  };
  events: {
    enabled: boolean;
    /** Minutes before start: 60 (1 hour) or 1440 (the day before) */
    lead: number;
  };
};

export const DEFAULT_PREFS: NotificationPrefs = {
  prayer: {
    enabled: false,
    mode: 'adhan',
    lead: 15,
    prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true, jummah: true },
  },
  events: { enabled: false, lead: 60 },
};

export type PlannedReminder = {
  id: string;
  title: string;
  body: string;
  at: Date;
  channel: 'prayer' | 'events';
  data: { kind: 'prayer' | 'event' | 'class'; key?: string; eventId?: string };
};

/** Pending-notification budget (iOS allows 64 per app). */
export const MAX_PRAYER_REMINDERS = 40;
export const MAX_EVENT_REMINDERS = 20;

const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  jummah: "Jumu'ah",
};

type DaySlot = { key: PrayerKey; slot: PrayerTime };

function slotsForDay(data: PrayerTimesResult, weekday: number): DaySlot[] {
  const jummah = data.jummah[0];
  return data.daily.flatMap((p): DaySlot[] => {
    // On Fridays Jumu'ah replaces Dhuhr.
    if (p.key === 'dhuhr' && weekday === 5 && jummah) return [{ key: 'jummah', slot: jummah }];
    return [{ key: p.key as PrayerKey, slot: p }];
  });
}

function resolveTimes(slot: PrayerTime, y: number, m: number, d: number) {
  let adhan = parseClock(slot.adhan);
  let approx = false;
  if (adhan === null && isSunsetLabel(slot.adhan)) {
    adhan = estimateSunsetMinutes(y, m, d, MASJID_TZ);
    approx = adhan !== null;
  }
  let iqamah = parseClock(slot.iqamah);
  if (iqamah === null) {
    const off = parseOffset(slot.iqamah);
    if (off !== null && adhan !== null) iqamah = adhan + off;
  }
  return { adhan, iqamah, approx };
}

const clock = (min: number, approx: boolean) => `${approx ? '≈ ' : ''}${formatClock(min)}`;

/** Salah reminders for the next `days` days (today included), soonest first. */
export function planPrayerReminders(
  data: PrayerTimesResult | null | undefined,
  prefs: NotificationPrefs,
  now: Date = new Date(),
  days = 7,
): PlannedReminder[] {
  if (!data || data.source !== 'live' || !prefs.prayer.enabled) return [];
  const today = zonedNow(MASJID_TZ, now);
  const out: PlannedReminder[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today.year, today.month, today.day, i);
    for (const { key, slot } of slotsForDay(data, day.weekday)) {
      if (!prefs.prayer.prayers[key]) continue;
      const { adhan, iqamah, approx } = resolveTimes(slot, day.year, day.month, day.day);
      const name = PRAYER_NAMES[key];
      const start = key === 'jummah' ? 'Khutbah' : 'Adhan';
      const iqamahNote = iqamah !== null ? ` Iqamah ${clock(iqamah, approx)}.` : '';
      let at: number | null = null;
      let title = '';
      let body = '';
      if (prefs.prayer.mode === 'beforeIqamah' && iqamah !== null) {
        at = iqamah - prefs.prayer.lead;
        title = `${name} · Iqamah ${clock(iqamah, approx)}`;
        body = `Iqamah in ${prefs.prayer.lead} minutes at ${MASJID_NAME}.`;
      } else if (adhan !== null) {
        at = adhan;
        title = `${name} · ${clock(adhan, approx)}`;
        body = `${start}${approx ? ' (sunset, estimated)' : ''} at ${MASJID_NAME}.${iqamahNote}`;
      } else if (iqamah !== null) {
        at = iqamah;
        title = `${name} · Iqamah ${clock(iqamah, approx)}`;
        body = `Iqamah now at ${MASJID_NAME}.`;
      }
      if (at === null) continue;
      const when = zonedTimeToUtc(day.year, day.month, day.day, at, MASJID_TZ);
      if (when.getTime() <= now.getTime() + 30_000) continue;
      out.push({ id: `prayer:${day.date}:${key}`, title, body, at: when, channel: 'prayer', data: { kind: 'prayer', key } });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_PRAYER_REMINDERS);
}

/** Every start time of an event within the window. */
function occurrences(e: EventItem, now: Date, horizonDays: number): Date[] {
  if (e.startsAt) {
    const t = new Date(e.startsAt);
    return Number.isNaN(t.getTime()) ? [] : [t];
  }
  if (e.weekday === undefined || e.startMinutes === undefined) return [];
  const today = zonedNow(MASJID_TZ, now);
  const list: Date[] = [];
  for (let i = 0; i <= Math.min(horizonDays, 14); i++) {
    const day = addDays(today.year, today.month, today.day, i);
    if (day.weekday === e.weekday) list.push(zonedTimeToUtc(day.year, day.month, day.day, e.startMinutes, MASJID_TZ));
  }
  return list;
}

const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: MASJID_TZ }).format(d);
const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: MASJID_TZ }).format(d);

/** Class and event reminders (live, dated or weekly items only), soonest first. */
export function planEventReminders(
  events: { items: EventItem[]; source: 'live' | 'sample' } | null | undefined,
  prefs: NotificationPrefs,
  now: Date = new Date(),
  horizonDays = 30,
): PlannedReminder[] {
  if (!events || events.source !== 'live' || !prefs.events.enabled) return [];
  const lead = prefs.events.lead;
  const horizon = now.getTime() + horizonDays * 86_400_000;
  const out: PlannedReminder[] = [];
  for (const e of events.items) {
    for (const start of occurrences(e, now, horizonDays)) {
      const at = new Date(start.getTime() - lead * 60_000);
      if (at.getTime() <= now.getTime() + 30_000 || start.getTime() > horizon) continue;
      const when = lead >= 1440 ? `Tomorrow, ${fmtDay(start)} at ${fmtTime(start)}` : `Starts in ${lead >= 60 ? `${lead / 60} hour${lead === 60 ? '' : 's'}` : `${lead} minutes`}, at ${fmtTime(start)}`;
      out.push({
        id: `event:${e.id}:${start.toISOString()}`,
        title: `${e.kind === 'class' ? 'Class' : 'Event'}: ${e.title}`,
        body: [when, e.location].filter(Boolean).join(' · '),
        at,
        channel: 'events',
        data: { kind: e.kind ?? 'event', eventId: e.id },
      });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_EVENT_REMINDERS);
}
