/**
 * Muslimoon Masajid API client for Abu Huraira Center.
 *
 * Base: https://masajid.muslimoon.app
 * Org:  e8a7eda8-3c55-4a9c-9b8f-9c9d37687534
 * Paths: /v1/<org_id>/...                 public, unauthenticated GET
 *        /api/public/<org_id>/forms/<id>  public form schema (Amaar, 2026-10-02)
 *
 * Endpoint status (re-probed 2026-10-02; samples in docs/samples/, details in
 * docs/muslimoon-api.md):
 *   GET /v1/<org_id>/prayer-times      -> 200, wired. NOT the final AHC times yet
 *                                         (not migrated from the old CMS, per Amaar).
 *   GET /v1/<org_id>/events            -> 200, []   (live when non-empty, else demo)
 *   GET /v1/<org_id>/programs          -> 200, []   (live when non-empty, else demo)
 *   GET /v1/<org_id>/announcement-bar  -> 200, 1 test item, wired (announcements)
 *   GET /v1/<org_id>/org-settings      -> 200, wired (YouTube / contact; empty today)
 *   GET /v1/<org_id>/campaigns         -> 200, { campaigns: [], categories: [] }
 *   GET /v1/<org_id>/services          -> 200, services [] + populated categories
 *   GET /v1/<org_id>/billboards | instructors | staff | faqs | donations -> 200, empty
 *   GET /v1/<org_id>/forms | pledges   -> 401 (needs auth)
 *   GET /v1/<org_id>/settings          -> 500 (server error)
 *   GET /v1/<org_id>/announcements     -> 404 (use announcement-bar)
 *   GET /api/public/<org_id>/forms/<id>-> route exists (JSON 404 "Form not found"
 *                                         for the sandbox id).
 *
 * Note (CORS): browsers can't read any of these. Most routes send no
 * Access-Control-Allow-Origin at all; org-settings and /api/public/* send `*`
 * only when the request has NO Origin header (curl), and omit it when a
 * browser sends one. So web builds fall back to demo data; native iOS/Android
 * are unaffected.
 *
 * Use EXPO_PUBLIC_* only — no secrets in the client.
 */

import { parseClock, parseWeekday, zonedNow, zonedTimeToUtc, addDays } from '@/src/utils/prayerTime';
import {
  asArray,
  asBool,
  asRecord,
  asString,
  isRecord,
  parseDateLoose,
  parseTimeRange,
  formatMinutes,
  pickBool,
  pickNum,
  pickStr,
  pickStringList,
  type Raw,
} from '@/src/api/parse';
import demoProgramsJson from '@/src/data/demo/programs.json';
import demoAnnouncementsJson from '@/src/data/demo/announcements.json';
import demoIqraFormJson from '@/src/data/demo/form-iqra.json';

const DEFAULT_BASE_URL = 'https://masajid.muslimoon.app';
const DEFAULT_ORG_ID = 'e8a7eda8-3c55-4a9c-9b8f-9c9d37687534';
const DEFAULT_TIMEZONE = 'America/Toronto';

const REQUEST_TIMEOUT_MS = 10_000;

const BASE_URL = (
  process.env.EXPO_PUBLIC_MUSLIMOON_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, '');
const ORG_ID =
  process.env.EXPO_PUBLIC_AHC_ORG_ID ||
  // legacy name, kept for existing .env files
  process.env.EXPO_PUBLIC_MUSLIMOON_ORG_ID ||
  DEFAULT_ORG_ID;

export const muslimoonConfig = {
  baseUrl: BASE_URL,
  orgId: ORG_ID,
  path: (segment: string) => `${BASE_URL}/v1/${ORG_ID}/${segment}`,
  /** Public routes such as forms: /api/public/<org_id>/<segment> */
  publicPath: (segment: string) => `${BASE_URL}/api/public/${ORG_ID}/${segment}`,
} as const;

/* ------------------------------------------------------------------ */
/* Raw API shapes (see docs/samples/*.json and docs/muslimoon-api.md)  */
/* ------------------------------------------------------------------ */

export type MuslimoonOrganization = {
  id: string;
  name?: string;
  slug?: string;
  display_name?: string;
  org_slug?: string;
};

/** A prayer slot. Values are local wall-clock strings ("1:30 PM") or labels ("Sunset", "+5 mins"). */
export type MuslimoonPrayerSlot = {
  athan: string | null;
  iqamah: string | null;
  khateeb?: string | null;
};

export type MuslimoonJanazah = {
  available: boolean;
  date: string | null;
  time: string | null;
  salah_location: string | null;
  cemetery_address: string | null;
};

export type MuslimoonPrayerTimesResponse = {
  success: boolean;
  organization: MuslimoonOrganization;
  prayer_times: {
    fajr: MuslimoonPrayerSlot | null;
    dhuhr: MuslimoonPrayerSlot | null;
    asr: MuslimoonPrayerSlot | null;
    maghrib: MuslimoonPrayerSlot | null;
    isha: MuslimoonPrayerSlot | null;
    jummah1: MuslimoonPrayerSlot | null;
    jummah2: MuslimoonPrayerSlot | null;
    jummah3: MuslimoonPrayerSlot | null;
    taraweeh: MuslimoonPrayerSlot | null;
    tahajjud: MuslimoonPrayerSlot | null;
    eid1: MuslimoonPrayerSlot | null;
    eid2: MuslimoonPrayerSlot | null;
    eid3: MuslimoonPrayerSlot | null;
    eid4: MuslimoonPrayerSlot | null;
    eid5: MuslimoonPrayerSlot | null;
    kusuf: MuslimoonPrayerSlot | null;
    khusuf: MuslimoonPrayerSlot | null;
    janazah: MuslimoonJanazah | null;
  };
  prayer_calendar_url: string | null;
  prayer_calendar_button_name: string | null;
  prayer_calendar_updated_at: string | null;
  friday_khutbahs: unknown[];
  next_friday: { date: string; khutbahs_scheduled: number } | null;
  khutbah_count: number;
  last_updated: string;
  timezone: string;
};

/** Item shapes for these lists are not known yet (AHC lists are empty). */
export type MuslimoonEventsResponse = {
  success: boolean;
  organization: MuslimoonOrganization;
  events: unknown[];
};
export type MuslimoonProgramsResponse = {
  organization: MuslimoonOrganization;
  programs: unknown[];
};
export type MuslimoonArticlesResponse = {
  success: boolean;
  organization: MuslimoonOrganization;
  articles: unknown[];
  count: number;
};

/* ------------------------------------------------------------------ */
/* App-level types                                                     */
/* ------------------------------------------------------------------ */

export type DailyPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerTime = {
  key: string;
  name: string;
  adhan: string | null;
  iqamah: string | null;
  khateeb?: string | null;
};

export type PrayerTimesResult = {
  source: 'live' | 'mock';
  /** Fajr, Dhuhr, Asr, Maghrib, Isha (only those present) */
  daily: (PrayerTime & { key: DailyPrayerKey })[];
  /** Jumu'ah slots present in the response */
  jummah: PrayerTime[];
  /** Other non-null slots (taraweeh, tahajjud, eid, eclipse prayers) */
  extras: PrayerTime[];
  janazah: MuslimoonJanazah | null;
  timezone: string;
  organizationName?: string;
  lastUpdated?: string;
  nextFriday?: string;
  calendarUrl?: string | null;
  calendarButtonName?: string | null;
  /** Set when the live request failed and mock data is being shown */
  error?: string;
};

export type EventRegistration = {
  /** Registration is required to attend */
  required: boolean;
  /** External sign-up page (Jotform / Google Forms / Muslimoon public form page) */
  url?: string;
  /** Muslimoon form id — schema at GET /api/public/<org>/forms/<formId> */
  formId?: string;
  /** Button label from the CMS, e.g. "Register Now - $80/month" */
  label?: string;
  /** Registration has closed */
  closed?: boolean;
};

/**
 * App-level event / class. Every field except id/title/date is optional so a
 * sparse or oddly-shaped CMS item still renders (see normalizeEvent).
 */
export type EventItem = {
  id: string;
  title: string;
  /** Display label: "Fri, Oct 9", "Every Sunday", "Upcoming" */
  date: string;
  time?: string;
  location?: string;
  description?: string;
  /** 'class' for Muslimoon programs, 'event' for events */
  kind?: 'event' | 'class';
  /** Exact start (ISO, UTC) when known — used for reminders */
  startsAt?: string;
  /** Weekly items: weekday (0 = Sunday) and start time (minutes since midnight, Toronto) */
  weekday?: number;
  startMinutes?: number;
  /* ---- Optional detail fields (shown on the detail screen when present) ---- */
  /** Longer description for the detail screen (description stays the short one) */
  body?: string;
  /** "Weekly Class", "Sisters", "Tafsir"… */
  category?: string;
  instructor?: string;
  /** Display price: "Free", "$80 / month" */
  fee?: string;
  /** Who it's for: "Sisters only", "Ages 5+" */
  audience?: string;
  /** Recurrence label, e.g. "Every Thursday · From Oct 1, 2026" */
  schedule?: string;
  endTime?: string;
  /** First / last date (YYYY-MM-DD, Toronto) when known */
  startDate?: string;
  endDate?: string;
  curriculum?: string[];
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  registration?: EventRegistration;
  /** For demo "this week" sessions: the program they belong to */
  programId?: string;
  /** Built-in demo item (website-based), never real CMS data */
  demo?: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  description?: string;
  goal?: number;
  raised?: number;
};

export type PledgeInput = {
  campaignId: string;
  amount: number;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  name: string;
  email: string;
  phone?: string;
};

export type PledgeResult = {
  id: string;
  status: 'mock' | 'pending' | 'confirmed';
  checkoutUrl?: string;
};

const DAILY: { key: DailyPrayerKey; name: string }[] = [
  { key: 'fajr', name: 'Fajr' },
  { key: 'dhuhr', name: 'Dhuhr' },
  { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isha', name: 'Isha' },
];

const JUMMAH: { key: 'jummah1' | 'jummah2' | 'jummah3'; name: string }[] = [
  { key: 'jummah1', name: "Jumu'ah" },
  { key: 'jummah2', name: "Jumu'ah 2" },
  { key: 'jummah3', name: "Jumu'ah 3" },
];

const EXTRAS: { key: keyof MuslimoonPrayerTimesResponse['prayer_times']; name: string }[] = [
  { key: 'taraweeh', name: 'Taraweeh' },
  { key: 'tahajjud', name: 'Tahajjud' },
  { key: 'eid1', name: 'Eid Prayer 1' },
  { key: 'eid2', name: 'Eid Prayer 2' },
  { key: 'eid3', name: 'Eid Prayer 3' },
  { key: 'eid4', name: 'Eid Prayer 4' },
  { key: 'eid5', name: 'Eid Prayer 5' },
  { key: 'kusuf', name: 'Salat al-Kusuf' },
  { key: 'khusuf', name: 'Salat al-Khusuf' },
];

function isSlot(v: unknown): v is MuslimoonPrayerSlot {
  return (
    !!v &&
    typeof v === 'object' &&
    ('athan' in v || 'iqamah' in v) &&
    (!!(v as MuslimoonPrayerSlot).athan || !!(v as MuslimoonPrayerSlot).iqamah)
  );
}

function toPrayer(key: string, name: string, slot: MuslimoonPrayerSlot): PrayerTime {
  return {
    key,
    name,
    adhan: slot.athan ?? null,
    iqamah: slot.iqamah ?? null,
    khateeb: slot.khateeb ?? null,
  };
}

/** Convert the raw Muslimoon payload into app-level prayer data. */
export function normalizePrayerTimes(
  raw: MuslimoonPrayerTimesResponse,
): PrayerTimesResult {
  const pt = raw.prayer_times;
  if (!pt || typeof pt !== 'object') {
    throw new Error('Response is missing prayer_times');
  }
  const daily = DAILY.flatMap(({ key, name }) => {
    const slot = pt[key];
    return isSlot(slot) ? [{ ...toPrayer(key, name, slot), key }] : [];
  });
  if (daily.length === 0) throw new Error('No daily prayer times in response');

  const jummah = JUMMAH.flatMap(({ key, name }) => {
    const slot = pt[key];
    return isSlot(slot) ? [toPrayer(key, name, slot)] : [];
  });
  const extras = EXTRAS.flatMap(({ key, name }) => {
    const slot = pt[key];
    return isSlot(slot) ? [toPrayer(key, name, slot)] : [];
  });

  return {
    source: 'live',
    daily,
    jummah,
    extras,
    janazah: pt.janazah ?? null,
    timezone: raw.timezone || DEFAULT_TIMEZONE,
    organizationName: raw.organization?.name ?? raw.organization?.display_name,
    lastUpdated: raw.last_updated,
    nextFriday: raw.next_friday?.date,
    calendarUrl: raw.prayer_calendar_url,
    calendarButtonName: raw.prayer_calendar_button_name,
  };
}

/** HTTP error that keeps the status, so callers can tell 404 (route/item missing) from outages. */
export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

async function getJson<T>(segment: string): Promise<T> {
  return getJsonUrl<T>(muslimoonConfig.path(segment));
}

async function getJsonUrl<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new HttpError(res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Raw GET /v1/<org_id>/prayer-times (throws on failure). */
export async function fetchPrayerTimesLive(): Promise<PrayerTimesResult> {
  const raw = await getJson<MuslimoonPrayerTimesResponse>('prayer-times');
  if (raw && raw.success === false) throw new Error('API returned success: false');
  return normalizePrayerTimes(raw);
}

/**
 * Today's prayer times for AHC from Muslimoon.
 * Falls back to mock data (with `source: 'mock'` and `error` set) if the request fails.
 *
 * IMPORTANT (Amaar, Muslimoon, 2026-10-02): the times in the Muslimoon API are
 * NOT AHC's real schedule yet — they haven't been migrated from the old CMS.
 * abuhuraira.org still reads the old CMS (e.g. Fajr 6:15/6:30 there vs
 * 6:00/5:15 in Muslimoon on 2026-10-02). Behaviour is unchanged on purpose: once
 * the migration lands, the same endpoint starts returning the real times with
 * no app change. See docs/muslimoon-api.md → "Prayer times are not final".
 */
export async function fetchPrayerTimes(): Promise<PrayerTimesResult> {
  try {
    return await fetchPrayerTimesLive();
  } catch (e) {
    const message =
      e instanceof Error
        ? e.name === 'AbortError'
          ? 'Request timed out'
          : e.message
        : String(e);
    return { ...mockPrayerTimes(), error: message };
  }
}

/** Mock prayer times (America/Toronto) — used only as an offline fallback. */
export function mockPrayerTimes(): PrayerTimesResult {
  return {
    source: 'mock',
    daily: [
      { key: 'fajr', name: 'Fajr', adhan: '5:42 AM', iqamah: '6:00 AM' },
      { key: 'dhuhr', name: 'Dhuhr', adhan: '1:15 PM', iqamah: '1:30 PM' },
      { key: 'asr', name: 'Asr', adhan: '4:45 PM', iqamah: '5:00 PM' },
      { key: 'maghrib', name: 'Maghrib', adhan: 'Sunset', iqamah: '+5 mins' },
      { key: 'isha', name: 'Isha', adhan: '8:40 PM', iqamah: '9:00 PM' },
    ],
    jummah: [{ key: 'jummah1', name: "Jumu'ah", adhan: '1:00 PM', iqamah: '1:30 PM' }],
    extras: [],
    janazah: null,
    timezone: DEFAULT_TIMEZONE,
  };
}

/* ------------------------------------------------------------------ */
/* Lists: events, programs, announcements, campaigns, services         */
/* ------------------------------------------------------------------ */
/*
 * AHC's events/programs lists on Muslimoon are empty today, so the exact item
 * shapes are not known. Amaar's guidance (2026-10-02): build website-based demo
 * data and make the types tolerant so real data can't crash the app. So:
 *  - every normaliser takes `unknown`, reads several field-name aliases
 *    (snake_case, camelCase, the old AHC CMS names), and never throws;
 *  - items without a title are skipped, archived/inactive ones dropped;
 *  - dates go through parseDateLoose (ISO with/without offset, microseconds,
 *    date-only, MM/DD/YYYY, "October 4, 2026", epoch);
 *  - when a list is empty the website-based demo data in src/data/demo/ is
 *    shown with source 'sample' (UI shows "Preview"; reminders ignore it).
 * Save a real sample in docs/samples/ when AHC publishes and tighten these.
 */

export type ListSource = 'live' | 'sample';
export type ListResult<T> = { items: T[]; source: ListSource; error?: string };

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** YYYY-MM-DD → "Sat, Oct 4" (no timezone shift: it's already a Toronto calendar date). */
function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  try {
    return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, d, 12)),
    );
  } catch {
    return date;
  }
}

/** YYYY-MM-DD → "Oct 4, 2026". */
function formatLongDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  try {
    return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, d, 12)),
    );
  } catch {
    return date;
  }
}

/** String or { name | full_name | title } → string. */
function nameOf(v: unknown): string | undefined {
  if (isRecord(v)) return pickStr(v, 'name', 'full_name', 'display_name', 'title', 'label');
  return asString(v);
}

/** Location may be a string or { name, address, room }. */
function locationOf(o: Raw): string | undefined {
  for (const k of ['location', 'venue', 'location_name', 'locationName', 'room', 'address']) {
    const v = o[k];
    if (isRecord(v)) {
      const parts = [pickStr(v, 'name', 'title'), pickStr(v, 'address', 'street', 'line1')].filter(Boolean);
      if (parts.length) return parts.join(', ');
    } else {
      const s = asString(v);
      if (s) return s;
    }
  }
  return undefined;
}

/** Price as display text: 0 → "Free", 80 → "$80", "110" → "$110", "$350 / month" stays. */
function feeOf(o: Raw): string | undefined {
  const text = pickStr(o, 'price_text', 'priceText', 'price_label', 'fee_text', 'cost_text');
  if (text) return text;
  for (const k of ['price', 'fee', 'cost', 'amount', 'price_amount']) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v === 0 ? 'Free' : `$${v % 1 ? v.toFixed(2) : v}`;
    const s = asString(v);
    if (s) return /^\d+(\.\d+)?$/.test(s) ? (Number(s) === 0 ? 'Free' : `$${s}`) : s;
  }
  return undefined;
}

/** Recurrence text: "Every Thursday", ["monday","wednesday"] → "Monday & Wednesday". */
function recurrenceOf(o: Raw): string | undefined {
  const text = pickStr(o, 'schedule', 'schedule_text', 'scheduleText', 'recurrence', 'recurrence_text', 'pattern', 'frequency', 'day', 'day_of_week');
  if (text) return text;
  const days = pickStringList(o, 'days_of_week', 'daysOfWeek', 'days', 'weekdays');
  if (days.length) {
    const nice = days.map((d) => {
      const i = parseWeekday(d);
      return i !== null ? WEEKDAY_LABELS[i] : d;
    });
    return nice.length === 1 ? `Every ${nice[0]}` : nice.join(' & ');
  }
  return undefined;
}

function registrationOf(o: Raw): EventRegistration | undefined {
  const reg = asRecord(o.registration);
  const required = pickBool(o, 'registration_required', 'registrationRequired', 'requires_registration', 'is_registration_required') ?? pickBool(reg, 'required');
  const url = pickStr(o, 'registration_url', 'registrationUrl', 'register_url', 'registration_link', 'externalRegistrationLink', 'external_registration_link', 'cta_link', 'ctaLink') ?? pickStr(reg, 'url', 'link');
  const formId = pickStr(o, 'form_id', 'formId', 'registration_form_id', 'registrationFormId') ?? pickStr(reg, 'form_id', 'formId');
  const label = pickStr(o, 'cta_label', 'ctaLabel', 'registration_label') ?? pickStr(reg, 'label');
  const open = pickBool(o, 'registration_open', 'is_registration_open', 'registrationOpen') ?? pickBool(reg, 'open');
  const closedFlag = pickBool(o, 'registration_closed', 'registrationClosed') ?? pickBool(reg, 'closed');
  const closed = closedFlag ?? (open === false ? true : undefined);
  if (required === undefined && !url && !formId && closed === undefined) return undefined;
  return {
    required: required ?? !!(url || formId),
    url: url && /^https?:\/\//i.test(url) ? url : undefined,
    formId,
    label,
    closed,
  };
}

/** True for items the CMS marks as archived, inactive, draft or cancelled. */
function isHidden(o: Raw): boolean {
  if (pickBool(o, 'is_archived', 'isArchived', 'archived', 'is_deleted', 'deleted') === true) return true;
  if (pickBool(o, 'is_active', 'isActive', 'active', 'is_published', 'published') === false) return true;
  const status = pickStr(o, 'status', 'state')?.toLowerCase();
  return !!status && ['archived', 'draft', 'cancelled', 'canceled', 'deleted', 'inactive', 'hidden'].includes(status);
}

/**
 * Raw Muslimoon event/program → EventItem. Never throws; returns null when
 * the item has no title or is archived/inactive. Accepts snake_case,
 * camelCase and the old AHC CMS field names (see docs/muslimoon-api.md).
 */
export function normalizeEvent(raw: unknown, index: number, kind: 'event' | 'class' = 'event'): EventItem | null {
  try {
    if (!isRecord(raw)) return null;
    const o = raw;
    if (isHidden(o)) return null;
    const title = pickStr(o, 'title', 'name', 'event_name', 'program_name', 'eventName', 'programName');
    if (!title) return null;

    const startRaw = o.start_date ?? o.startDate ?? o.date ?? o.event_date ?? o.eventDate ?? o.starts_at ?? o.startsAt ?? o.start ?? o.start_datetime ?? o.start_at;
    const endRaw = o.end_date ?? o.endDate ?? o.ends_at ?? o.endsAt ?? o.end_datetime ?? o.end_at;
    const start = parseDateLoose(startRaw, DEFAULT_TIMEZONE);
    const end = parseDateLoose(endRaw, DEFAULT_TIMEZONE);
    const recurring = recurrenceOf(o) ?? (start ? undefined : asString(startRaw)); // "Every Friday" stored in `date`

    const clockText = pickStr(o, 'start_time', 'startTime', 'time', 'event_time', 'time_text', 'timeText', 'time_range');
    const endClockText = pickStr(o, 'end_time', 'endTime');
    const range = parseTimeRange(clockText);
    const startMin = parseClock(clockText) ?? range?.start ?? start?.minutes ?? null;
    const endMin = parseClock(endClockText) ?? parseTimeRange(endClockText)?.start ?? range?.end ?? (end?.date === start?.date ? end?.minutes : null) ?? null;

    // Exact instant: explicit offset wins; otherwise date + clock in Toronto.
    let startsAt: string | undefined;
    if (start) {
      if (start.absolute && start.instant && !clockText) startsAt = start.instant.toISOString();
      else if (startMin !== null) startsAt = zonedTimeToUtc(start.year, start.month, start.day, startMin, DEFAULT_TIMEZONE).toISOString();
    }

    // A dated *program* that recurs weekly is still weekly (start_date = first session).
    // Only single-day patterns get a weekday: "Mon & Wed" / "Sat – Sun" stay
    // label-only so reminders never fire for just one of the days.
    const weeklyDay = singleWeekday(recurring);
    const isWeekly = weeklyDay !== null && (kind === 'class' || !start);
    const weekday = isWeekly ? weeklyDay : null;

    // Time label: keep the CMS's own words ("After Fajr", "Maghrib to Isha"),
    // otherwise format parsed minutes.
    const timeLabel = range
      ? `${formatMinutes(range.start)}${range.end !== undefined ? ` – ${formatMinutes(range.end)}` : endMin !== null && endMin > range.start ? ` – ${formatMinutes(endMin)}` : ''}`
      : clockText && parseClock(clockText) === null
        ? clockText
        : startMin !== null
          ? `${formatMinutes(startMin)}${endMin !== null && endMin > startMin ? ` – ${formatMinutes(endMin)}` : ''}`
          : undefined;

    const dateLabel = isWeekly || (kind === 'class' && recurring)
      ? recurring!
      : start
        ? formatDay(start.date)
        : recurring ?? 'Upcoming';

    const schedule = [
      recurring,
      start && (isWeekly || kind === 'class') ? `${start.date < todayIso() ? 'Since' : 'From'} ${formatLongDay(start.date)}` : undefined,
      end && kind === 'class' ? `until ${formatLongDay(end.date)}` : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || undefined;

    const shortDesc = pickStr(o, 'short_description', 'shortDescription', 'summary', 'subtitle', 'excerpt');
    const longDesc = pickStr(o, 'description', 'details', 'body', 'content', 'long_description');
    const category = nameOf(o.category) ?? pickStr(o, 'category_name', 'categoryName', 'type_label', 'program_type', 'programType', 'type', 'event_type');

    return {
      id: pickStr(o, 'id', 'uuid', 'slug') ?? `item-${index}`,
      title,
      date: dateLabel,
      time: timeLabel,
      location: locationOf(o),
      description: shortDesc ?? longDesc,
      body: longDesc && longDesc !== shortDesc ? longDesc : undefined,
      kind,
      startsAt,
      weekday: weekday ?? undefined,
      startMinutes: weekday !== null && startMin !== null ? startMin : undefined,
      category: category ? prettyCategory(category) : undefined,
      instructor: nameOf(o.instructor) ?? pickStr(o, 'instructor_name', 'instructorName', 'speaker', 'speaker_name', 'teacher', 'presenter', 'sheikh', 'imam') ?? nameOf(o.speaker),
      fee: feeOf(o),
      audience: pickStr(o, 'audience', 'age_group', 'ageGroup', 'age', 'ages', 'gender', 'eligibility'),
      schedule,
      endTime: endMin !== null ? formatMinutes(endMin) : undefined,
      startDate: start?.date,
      endDate: end?.date,
      curriculum: pickStringList(o, 'curriculum', 'curriculum_items', 'curriculumItems', 'topics', 'highlights'),
      imageUrl: pickStr(o, 'image_url', 'imageUrl', 'image', 'flyer_image', 'flyerImage', 'cover_image', 'banner_url', 'thumbnail_url'),
      contactEmail: pickStr(o, 'contact_email', 'contactEmail', 'email'),
      contactPhone: pickStr(o, 'contact_phone', 'contactPhone', 'phone'),
      registration: registrationOf(o),
    };
  } catch {
    return null;
  }
}

const DAY_RE = /\b(sun|mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|satur)(day)?s?\b/gi;
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, wednes: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6, satur: 6 };

/** Weekday (0 = Sunday) when the text names exactly one day ("Every Friday", "Thursdays"), else null. */
export function singleWeekday(text: string | undefined): number | null {
  if (!text) return null;
  const days = new Set<number>();
  for (const m of text.matchAll(DAY_RE)) days.add(DAY_INDEX[m[1].toLowerCase()]);
  if (days.size !== 1) return null;
  return [...days][0];
}

/** "LONGTERM" → "Long-term", "weekly_class" → "Weekly class"; mixed-case stays. */
function prettyCategory(v: string): string {
  const map: Record<string, string> = { LONGTERM: 'Long-term', INTENSIVE: 'Intensive', RECURRING: 'Recurring', ONE_TIME: 'One-time' };
  if (map[v.toUpperCase()]) return map[v.toUpperCase()];
  if (v === v.toUpperCase() || v === v.toLowerCase()) {
    const t = v.replace(/[_-]+/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return v;
}

function todayIso(now: Date = new Date()) {
  return zonedNow(DEFAULT_TIMEZONE, now).date;
}

export function normalizeCampaign(raw: unknown, index: number): Campaign | null {
  try {
    if (!isRecord(raw) || isHidden(raw)) return null;
    const o = raw;
    const name = pickStr(o, 'name', 'title', 'campaign_name');
    if (!name) return null;
    const goal = pickNum(o, 'goal', 'goal_amount', 'target', 'target_amount');
    const raised = pickNum(o, 'raised', 'raised_amount', 'amount_raised', 'total_raised', 'current_amount');
    return {
      id: pickStr(o, 'id', 'uuid', 'slug') ?? `campaign-${index}`,
      name,
      description: pickStr(o, 'short_description', 'description', 'summary'),
      goal: goal && goal > 0 ? goal : undefined,
      raised: goal && goal > 0 ? raised ?? 0 : undefined,
    };
  } catch {
    return null;
  }
}

function errorText(e: unknown) {
  return e instanceof Error ? (e.name === 'AbortError' ? 'Request timed out' : e.message) : String(e);
}

/* ---------------------------- Demo data ---------------------------- */

/** Website-based demo programs (src/data/demo/programs.json), normalised like live data. */
export function demoPrograms(): EventItem[] {
  return asArray(asRecord(demoProgramsJson).programs).flatMap((r, i) => {
    const e = normalizeEvent(r, i, 'class');
    return e ? [{ ...e, demo: true }] : [];
  });
}

/**
 * Demo "This week at AHC" sessions: the next dated occurrence of each weekly
 * demo class with a clock time, as Muslimoon-style event objects (mirrors the
 * website's "This Week at AHC" strip). Generated relative to `now` so the
 * preview always looks upcoming.
 */
export function demoEvents(now: Date = new Date(), max = 4): EventItem[] {
  const today = zonedNow(DEFAULT_TIMEZONE, now);
  const out: { raw: Raw; at: number }[] = [];
  for (const p of demoPrograms()) {
    if (p.weekday === undefined || p.startMinutes === undefined) continue;
    for (let i = 0; i < 7; i++) {
      const d = addDays(today.year, today.month, today.day, i);
      if (d.weekday !== p.weekday) continue;
      const at = zonedTimeToUtc(d.year, d.month, d.day, p.startMinutes, DEFAULT_TIMEZONE);
      if (at.getTime() <= now.getTime()) continue;
      out.push({
        at: at.getTime(),
        raw: {
          id: `demo-evt-${p.id.replace(/^demo-prog-/, '')}-${d.date}`,
          title: p.title,
          event_date: d.date,
          start_time: formatMinutes(p.startMinutes),
          end_time: p.endTime ?? null,
          location: p.location ?? null,
          short_description: p.description ?? null,
          description: p.body ?? p.description ?? null,
          instructor_name: p.instructor ?? null,
          price_text: p.fee ?? null,
          audience: p.audience ?? null,
          category: p.category ?? null,
          registration_url: p.registration?.url ?? null,
          registration_required: p.registration?.required ?? false,
          form_id: p.registration?.formId ?? null,
          program_id: p.id,
        },
      });
      break;
    }
  }
  return out
    .sort((a, b) => a.at - b.at)
    .slice(0, max)
    .flatMap(({ raw }, i) => {
      const e = normalizeEvent(raw, i, 'event');
      return e ? [{ ...e, demo: true, programId: asString(raw.program_id) }] : [];
    });
}

/* ------------------------- Events + programs ------------------------ */

let lastEvents: EventItem[] = [];

/** Find an item from the most recent fetchEventsResult (or the demo set) by id. */
export function findEventById(id: string): EventItem | undefined {
  return lastEvents.find((e) => e.id === id) ?? [...demoEvents(), ...demoPrograms()].find((e) => e.id === id);
}

/** Drop dated one-off events that ended before today (Toronto). Programs are kept. */
function isCurrent(e: EventItem, today: string) {
  if (e.kind === 'class' || e.weekday !== undefined) return !e.endDate || e.endDate >= today;
  const last = e.endDate ?? e.startDate;
  return !last || last >= today;
}

/**
 * Events + programs from Muslimoon (GET /events and /programs, in parallel).
 * Live items when either list has data (merged, dated events first);
 * otherwise the website-based demo set, with source 'sample'.
 */
export async function fetchEventsResult(): Promise<ListResult<EventItem>> {
  const [events, programs] = await Promise.allSettled([
    getJson<MuslimoonEventsResponse>('events'),
    getJson<MuslimoonProgramsResponse>('programs'),
  ]);
  const evs = events.status === 'fulfilled' ? asArray(asRecord(events.value).events ?? events.value) : [];
  const progs = programs.status === 'fulfilled' ? asArray(asRecord(programs.value).programs ?? programs.value) : [];
  const today = todayIso();
  const liveEvents = evs
    .flatMap((r, i) => normalizeEvent(r, i, 'event') ?? [])
    .filter((e) => isCurrent(e, today))
    .sort((a, b) => (a.startsAt ?? a.startDate ?? '9999').localeCompare(b.startsAt ?? b.startDate ?? '9999'));
  const livePrograms = progs
    .flatMap((r, i) => normalizeEvent(r, i, 'class') ?? [])
    .filter((e) => isCurrent(e, today))
    .map((e) => ({ ...e, id: `class-${e.id}` }));
  const items = [...liveEvents, ...livePrograms];
  if (items.length > 0) {
    lastEvents = items;
    return { items, source: 'live' };
  }
  const failed = [events, programs].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
  const demo = [...demoEvents(), ...demoPrograms()];
  lastEvents = demo;
  return { items: demo, source: 'sample', error: failed ? errorText(failed.reason) : undefined };
}

/** Back-compat: just the items. */
export async function fetchEvents(): Promise<EventItem[]> {
  return (await fetchEventsResult()).items;
}

/* --------------------------- Announcements --------------------------- */

export type Announcement = {
  id: string;
  /** Main text (Muslimoon `message`) */
  message: string;
  /** Optional headline (not in the announcement-bar shape today; shown when present) */
  title?: string;
  category?: string;
  linkText?: string;
  linkUrl?: string;
  /** Muslimoon can point an announcement at a donation campaign */
  campaignId?: string;
  createdAt?: string;
  demo?: boolean;
};

/** Raw announcement-bar item → Announcement. Never throws; null when there's no text or it's inactive. */
export function normalizeAnnouncement(raw: unknown, index: number): Announcement | null {
  try {
    if (!isRecord(raw) || isHidden(raw)) return null;
    const o = raw;
    const message = pickStr(o, 'message', 'text', 'body', 'content', 'description');
    const title = pickStr(o, 'title', 'headline', 'subject');
    if (!message && !title) return null;
    const url = pickStr(o, 'link_url', 'linkUrl', 'url', 'link', 'cta_link');
    return {
      id: pickStr(o, 'id', 'uuid') ?? `announcement-${index}`,
      message: message ?? title!,
      title: message ? title : undefined,
      category: nameOf(o.category),
      linkText: pickStr(o, 'link_text', 'linkText', 'cta_label', 'button_text'),
      linkUrl: url && /^https?:\/\//i.test(url) ? url : undefined,
      campaignId: pickStr(o, 'campaign_id', 'campaignId'),
      createdAt: parseDateLoose(o.created_at ?? o.createdAt)?.date,
    };
  } catch {
    return null;
  }
}

function sortByOrder(list: unknown[]): unknown[] {
  return list
    .map((r, i) => ({ r, i, o: isRecord(r) ? pickNum(r, 'display_order', 'displayOrder', 'order', 'position') : undefined }))
    .sort((a, b) => (a.o ?? 1e9) - (b.o ?? 1e9) || a.i - b.i)
    .map((x) => x.r);
}

export function demoAnnouncements(): Announcement[] {
  return sortByOrder(asArray(asRecord(demoAnnouncementsJson).items)).flatMap((r, i) => {
    const a = normalizeAnnouncement(r, i);
    return a ? [{ ...a, demo: true }] : [];
  });
}

/**
 * Announcements: GET /v1/<org>/announcement-bar (activated by Amaar on
 * 2026-10-02; /v1/<org>/announcements is still 404). Live when non-empty,
 * otherwise the website's community announcements as a labelled preview.
 */
export async function fetchAnnouncementsResult(): Promise<ListResult<Announcement>> {
  try {
    const raw = await getJson<unknown>('announcement-bar');
    const r = asRecord(raw);
    const items = sortByOrder(asArray(r.items ?? r.announcements ?? r.data ?? raw)).flatMap((x, i) => normalizeAnnouncement(x, i) ?? []);
    if (items.length > 0) return { items, source: 'live' };
    return { items: demoAnnouncements(), source: 'sample' };
  } catch (e) {
    return { items: demoAnnouncements(), source: 'sample', error: errorText(e) };
  }
}

/* -------------------- Org settings / static details ------------------ */

export type StaticDetails = {
  source: 'live' | 'fallback';
  youtubeUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  socials: { platform: string; url: string }[];
};

/** Every string value in a JSON tree (bounded), with its key. */
function walkStrings(v: unknown, key = '', depth = 0, out: { key: string; value: string }[] = []) {
  if (depth > 6 || out.length > 500) return out;
  if (typeof v === 'string') out.push({ key, value: v });
  else if (Array.isArray(v)) v.forEach((x) => walkStrings(x, key, depth + 1, out));
  else if (isRecord(v)) for (const [k, x] of Object.entries(v)) walkStrings(x, k, depth + 1, out);
  return out;
}

/** Normalise "@Handle", "youtube.com/c/x", "https://www.youtube.com/@x" → https URL. */
export function youtubeUrlFrom(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (/^@[\w.-]+$/.test(v)) return `https://www.youtube.com/${v}`;
  if (/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(v)) return v.startsWith('http') ? v : `https://${v}`;
  if (/^UC[\w-]{22}$/.test(v)) return `https://www.youtube.com/channel/${v}`;
  return undefined;
}

/**
 * Static details (Settings > Static Details in the CMS, per Amaar). The public
 * route that exposes settings is GET /v1/<org>/org-settings (the same payload
 * abuhuraira.org loads via its own /api/org-settings). On 2026-10-02 its footer.social_links
 * and footer.contact_info were empty, so callers fall back to the website
 * values in theme `brand`. The search is deliberately loose (any key or URL
 * mentioning YouTube) because the field name isn't confirmed.
 * /v1/<org>/settings exists too but returns 500.
 */
export async function fetchStaticDetails(): Promise<StaticDetails> {
  try {
    const raw = asRecord(await getJson<unknown>('org-settings'));
    const footer = asRecord(raw.footer);
    const contact = asRecord(footer.contact_info ?? raw.contact_info ?? raw.static_details ?? raw.contact);
    const socials = asArray(footer.social_links ?? raw.social_links ?? raw.socials).flatMap((s) => {
      if (!isRecord(s)) return [];
      const url = pickStr(s, 'url', 'link', 'href', 'value');
      const platform = pickStr(s, 'platform', 'type', 'name', 'key', 'label') ?? '';
      return url ? [{ platform, url }] : [];
    });
    const strings = walkStrings(raw);
    const yt =
      youtubeUrlFrom(socials.find((s) => /youtube/i.test(s.platform) || /youtu/i.test(s.url))?.url) ??
      youtubeUrlFrom(strings.find((s) => /youtube/i.test(s.key))?.value) ??
      youtubeUrlFrom(strings.find((s) => /youtube\.com|youtu\.be/i.test(s.value))?.value);
    return {
      source: 'live',
      youtubeUrl: yt,
      address: pickStr(contact, 'address', 'street_address'),
      phone: pickStr(contact, 'phone', 'phone_number'),
      email: pickStr(contact, 'email'),
      socials,
    };
  } catch {
    return { source: 'fallback', socials: [] };
  }
}

/* ------------------------------- Forms ------------------------------- */

export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'multiselect' | 'info';
export type FormOption = { label: string; value: string };
export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: FormOption[];
};
export type FormSchema = {
  id: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  fields: FormField[];
  /** Demo schema (website-based), not from Muslimoon */
  demo?: boolean;
};

const FIELD_TYPES: Record<string, FormFieldType> = {
  text: 'text', short_text: 'text', shorttext: 'text', input: 'text', string: 'text', name: 'text', full_name: 'text',
  textarea: 'textarea', long_text: 'textarea', longtext: 'textarea', paragraph: 'textarea', multiline: 'textarea',
  email: 'email', email_address: 'email',
  phone: 'phone', tel: 'phone', telephone: 'phone', phone_number: 'phone', mobile: 'phone',
  number: 'number', numeric: 'number', integer: 'number', age: 'number',
  date: 'date', datetime: 'date', birthday: 'date', date_of_birth: 'date',
  select: 'select', dropdown: 'select', single_select: 'select', choice: 'select',
  radio: 'radio', radio_group: 'radio', multiple_choice: 'radio', single_choice: 'radio',
  checkbox: 'checkbox', boolean: 'checkbox', consent: 'checkbox', agree: 'checkbox', terms: 'checkbox',
  checkboxes: 'multiselect', multi_select: 'multiselect', multiselect: 'multiselect', checkbox_group: 'multiselect',
  heading: 'info', section: 'info', paragraph_text: 'info', static_text: 'info', html: 'info', divider: 'info',
};

function normalizeOptions(v: unknown): FormOption[] {
  const list = typeof v === 'string' ? v.split(/\r?\n|,/) : asArray(v);
  return list.flatMap((x) => {
    const s = asString(x);
    if (s) return [{ label: s, value: s }];
    if (isRecord(x)) {
      const label = pickStr(x, 'label', 'name', 'title', 'text', 'value');
      const value = pickStr(x, 'value', 'id', 'key') ?? label;
      return label && value ? [{ label, value }] : [];
    }
    return [];
  });
}

export function normalizeFormField(raw: unknown, index: number): FormField | null {
  try {
    if (!isRecord(raw)) return null;
    const o = raw;
    const label = pickStr(o, 'label', 'title', 'question', 'name', 'text');
    if (!label) return null;
    const typeKey = (pickStr(o, 'type', 'field_type', 'fieldType', 'input_type', 'kind') ?? 'text').toLowerCase().replace(/[\s-]+/g, '_');
    const options = normalizeOptions(o.options ?? o.choices ?? o.values ?? o.items);
    let type: FormFieldType = FIELD_TYPES[typeKey] ?? (options.length ? 'select' : 'text');
    if ((type === 'select' || type === 'radio' || type === 'multiselect') && options.length === 0) type = 'text';
    return {
      id: pickStr(o, 'id', 'key', 'name', 'field_id', 'slug') ?? `field-${index}`,
      label,
      type,
      required: pickBool(o, 'required', 'is_required', 'isRequired', 'mandatory') ?? asBool(asRecord(o.validation).required) ?? false,
      placeholder: pickStr(o, 'placeholder', 'hint'),
      helpText: pickStr(o, 'help_text', 'helpText', 'description', 'subtitle'),
      options,
    };
  } catch {
    return null;
  }
}

/** Any plausible form payload → FormSchema, or null when it has no usable fields. */
export function normalizeFormSchema(raw: unknown, fallbackId = 'form'): FormSchema | null {
  try {
    const root = asRecord(raw);
    const form = asRecord(root.form ?? root.data ?? root);
    const schema = asRecord(form.schema ?? form.definition ?? form.config);
    let rawFields = asArray(form.fields ?? form.questions ?? form.form_fields ?? form.formFields ?? schema.fields ?? schema.questions ?? schema.properties);
    if (!rawFields.length) {
      // { sections: [{ fields: [...] }] }
      rawFields = asArray(form.sections ?? schema.sections ?? form.pages).flatMap((sec) => asArray(asRecord(sec).fields ?? asRecord(sec).questions));
    }
    if (!rawFields.length && isRecord(schema.properties)) {
      // JSON-schema style { properties: { name: { title, type } }, required: [...] }
      const req = new Set(asArray(schema.required).map(String));
      rawFields = Object.entries(schema.properties).map(([k, v]) => ({ ...asRecord(v), id: k, label: pickStr(asRecord(v), 'title') ?? k, required: req.has(k) }));
    }
    const fields = rawFields.flatMap((f, i) => normalizeFormField(f, i) ?? []);
    if (!fields.some((f) => f.type !== 'info')) return null;
    return {
      id: pickStr(form, 'id', 'form_id', 'uuid') ?? fallbackId,
      title: pickStr(form, 'title', 'name'),
      description: pickStr(form, 'description', 'subtitle', 'intro'),
      submitLabel: pickStr(form, 'submit_button_text', 'submit_label', 'submitLabel', 'button_text', 'cta_label'),
      fields,
    };
  } catch {
    return null;
  }
}

const DEMO_FORMS: Record<string, unknown> = { 'demo-iqra-registration': demoIqraFormJson };

export type FormSchemaResult =
  | { status: 'ok'; schema: FormSchema }
  | { status: 'not-found' }
  | { status: 'unusable' }
  | { status: 'error'; error: string };

/**
 * GET /api/public/<org>/forms/<formId> (public, no auth). Per Amaar, each
 * form's id (and the org id) is noted when the form is created in the CMS.
 * Demo ids resolve locally and never hit the network.
 */
export async function fetchFormSchema(formId: string): Promise<FormSchemaResult> {
  if (DEMO_FORMS[formId]) {
    const schema = normalizeFormSchema(DEMO_FORMS[formId], formId);
    return schema ? { status: 'ok', schema: { ...schema, demo: true } } : { status: 'unusable' };
  }
  try {
    const raw = await getJsonUrl<unknown>(muslimoonConfig.publicPath(`forms/${encodeURIComponent(formId)}`));
    const schema = normalizeFormSchema(raw, formId);
    return schema ? { status: 'ok', schema } : { status: 'unusable' };
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return { status: 'not-found' };
    return { status: 'error', error: errorText(e) };
  }
}

/**
 * In-app form submission is OFF until Muslimoon confirms the submit route and
 * payload shape. Keep this false — and never post test data to the live API.
 */
export const FORM_SUBMISSION_ENABLED = false;

/**
 * TODO(Muslimoon/Amaar): confirm how public form submission works — most
 * likely `POST /api/public/<org>/forms/<formId>` (the route already answers
 * OPTIONS with `Access-Control-Allow-Methods: GET, POST, …`) with a JSON body
 * keyed by field id — plus the success/validation response shape and any spam
 * protection (captcha / rate limit). Until then this does not touch the network.
 */
export async function submitForm(formId: string, values: Record<string, unknown>): Promise<{ ok: false; reason: 'not-enabled' }> {
  void formId;
  void values;
  // When confirmed, roughly:
  // const res = await fetch(muslimoonConfig.publicPath(`forms/${formId}`), {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
  return { ok: false, reason: 'not-enabled' };
}

/* ----------------------------- Campaigns ----------------------------- */

/**
 * Default causes shown until campaigns are published in Muslimoon. Names only —
 * no goal/raised figures, so the app never shows invented numbers.
 */
const DEFAULT_CAUSES: Campaign[] = [
  { id: 'dollar-a-day', name: 'Dollar a Day', description: 'Sustain the masjid with a daily gift.' },
  { id: 'general', name: 'General Fund', description: 'Support operations, utilities, and programs.' },
  { id: 'zakat', name: 'Zakat', description: 'Obligatory charity distributed to those in need.' },
  { id: 'sadaqah', name: 'Sadaqah', description: 'Voluntary charity for community care.' },
];

type MuslimoonCampaignsResponse = {
  campaigns: unknown[];
  categories?: unknown[];
  organization: MuslimoonOrganization;
};

/** GET /v1/<org>/campaigns — live when AHC has campaigns, else the default causes. */
export async function fetchCampaignsResult(): Promise<ListResult<Campaign>> {
  try {
    const raw = await getJson<MuslimoonCampaignsResponse>('campaigns');
    const items = asArray(asRecord(raw).campaigns).flatMap((c, i) => normalizeCampaign(c, i) ?? []);
    if (items.length > 0) return { items, source: 'live' };
    return { items: DEFAULT_CAUSES, source: 'sample' };
  } catch (e) {
    return { items: DEFAULT_CAUSES, source: 'sample', error: errorText(e) };
  }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return (await fetchCampaignsResult()).items;
}

/* --------------------------- Services etc. --------------------------- */

export type ServiceCategory = { id: string; name: string; description?: string };

/**
 * GET /v1/<org>/services — AHC has no services yet, but the category list is
 * populated (and duplicated server-side, so it is de-duplicated by name here).
 * Not shown in the UI yet; ready for a "Services" section.
 */
export async function fetchServices(): Promise<{ services: unknown[]; categories: ServiceCategory[] }> {
  const raw = asRecord(await getJson<unknown>('services'));
  const seen = new Set<string>();
  const categories = asArray(raw.categories).flatMap((c) => {
    if (!isRecord(c)) return [];
    const name = pickStr(c, 'name');
    if (!name || seen.has(name.toLowerCase())) return [];
    seen.add(name.toLowerCase());
    return [{ id: pickStr(c, 'id') ?? name, name, description: pickStr(c, 'description') }];
  });
  return { services: asArray(raw.services), categories };
}

/** GET /v1/<org>/articles — raw list (empty for AHC today). */
export async function fetchArticles(): Promise<unknown[]> {
  return asArray(asRecord(await getJson<unknown>('articles')).articles);
}

/**
 * Pledge creation — no public Muslimoon endpoint exists (/v1/<org>/pledges is
 * 401). Donations go to the IRM checkout (src/config/donations.ts); this stays
 * a no-op until a pledge / donor-record endpoint is confirmed.
 */
export async function createPledge(input: PledgeInput): Promise<PledgeResult> {
  void input;
  return { id: `local-${Date.now()}`, status: 'mock' };
}
