/**
 * Muslimoon Masajid API client for Abu Huraira Center.
 *
 * Base: https://masajid.muslimoon.app
 * Org:  e8a7eda8-3c55-4a9c-9b8f-9c9d37687534
 * Paths: /v1/<org_id>/...   (public, unauthenticated GET)
 *
 * Verified public endpoints (sample responses in docs/samples/):
 *   GET /v1/<org_id>/prayer-times   -> live, wired below
 *   GET /v1/<org_id>/events         -> live, currently returns []
 *   GET /v1/<org_id>/programs       -> live, currently returns []
 *   GET /v1/<org_id>/articles       -> live, currently returns []
 *   GET /v1/<org_id>/campaigns      -> live, { campaigns: [], categories: [] } (found 2026-10-01)
 *   GET /v1/<org_id>/services       -> live, services [] + populated categories
 *   GET /v1/<org_id>/forms          -> 401 (needs auth — Muslimoon credentials)
 *   GET /v1/<org_id>/settings       -> 500 (server error)
 *   GET /v1/<org_id>/announcements  -> 404 (not available)
 *
 * Note: the API does not send CORS headers, so browser (web) builds cannot
 * read it and fall back to the mock data. Native iOS/Android are unaffected.
 *
 * Use EXPO_PUBLIC_* only — no secrets in the client.
 */

import { parseClock, parseWeekday, zonedTimeToUtc } from '@/src/utils/prayerTime';

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

async function getJson<T>(segment: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(muslimoonConfig.path(segment), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
/* Lists: events, programs, campaigns, services, articles              */
/* ------------------------------------------------------------------ */
/*
 * AHC's lists on Muslimoon are empty today, so the exact item shapes are not
 * known. The normalisers below read the field names Muslimoon is most likely
 * to use (several aliases each) and skip anything without a title, so real
 * data shows up the moment AHC publishes it — then tighten these types against
 * a real sample (save it in docs/samples/).
 */

export type ListSource = 'live' | 'sample';
export type ListResult<T> = { items: T[]; source: ListSource; error?: string };

type Raw = Record<string, unknown>;

function pickStr(o: Raw, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function pickNum(o: Raw, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

const isoLike = /^\d{4}-\d{2}-\d{2}/;

/** "2026-10-04" / ISO timestamp → "Sat, Oct 4" (Toronto time); other strings pass through. */
function formatDateLabel(value: string | undefined): string | undefined {
  if (!value || !isoLike.test(value)) return value;
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_TIMEZONE,
  }).format(d);
}

/** Time from an ISO timestamp → "6:00 PM" (Toronto time). */
function formatTimeLabel(value: string | undefined): string | undefined {
  if (!value || !isoLike.test(value) || value.length <= 10) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: DEFAULT_TIMEZONE }).format(d);
}

/** Exact start instant from a date/timestamp plus an optional clock string (Toronto wall-clock when no offset is given). */
function resolveStart(start: string | undefined, clock: string | undefined): string | undefined {
  if (!start || !isoLike.test(start)) return undefined;
  const [y, m, d] = start.slice(0, 10).split('-').map(Number);
  const hasTime = start.length > 10;
  if (hasTime && /([zZ]|[+-]\d{2}:?\d{2})$/.test(start)) {
    const t = new Date(start);
    return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
  }
  let minutes: number | null = null;
  if (hasTime) {
    const hh = Number(start.slice(11, 13));
    const mm = Number(start.slice(14, 16));
    if (Number.isFinite(hh) && Number.isFinite(mm)) minutes = hh * 60 + mm;
  }
  if (clock) minutes = parseClock(clock) ?? minutes;
  if (minutes === null) return undefined;
  return zonedTimeToUtc(y, m, d, minutes, DEFAULT_TIMEZONE).toISOString();
}

export function normalizeEvent(raw: unknown, index: number, kind: 'event' | 'class' = 'event'): EventItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Raw;
  const title = pickStr(o, 'title', 'name', 'event_name', 'program_name');
  if (!title) return null;
  const start = pickStr(o, 'start_date', 'date', 'event_date', 'starts_at', 'start', 'start_datetime');
  const recurring = pickStr(o, 'schedule', 'recurrence', 'days', 'day', 'frequency');
  const clock = pickStr(o, 'start_time', 'time', 'event_time');
  const startsAt = resolveStart(start, clock);
  const weekday = !startsAt ? parseWeekday(recurring) : null;
  const startMinutes = weekday !== null ? parseClock(clock) : null;
  return {
    id: pickStr(o, 'id', 'uuid', 'slug') ?? `item-${index}`,
    title,
    date: formatDateLabel(start) ?? recurring ?? 'Upcoming',
    time: clock ?? formatTimeLabel(start),
    location: pickStr(o, 'location', 'venue', 'room', 'address', 'location_name'),
    description: pickStr(o, 'short_description', 'summary', 'description', 'details'),
    kind,
    startsAt,
    weekday: weekday ?? undefined,
    startMinutes: startMinutes ?? undefined,
  };
}

export function normalizeCampaign(raw: unknown, index: number): Campaign | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Raw;
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
}

function errorText(e: unknown) {
  return e instanceof Error ? (e.name === 'AbortError' ? 'Request timed out' : e.message) : String(e);
}

/** Built-in sample events — shown (labelled "Preview") until AHC publishes real ones. */
const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Friday Khutbah',
    date: 'Every Friday',
    time: '1:00 PM',
    location: 'Main Prayer Hall',
    description: 'Weekly congregational prayer and sermon.',
  },
  {
    id: 'evt-2',
    title: 'Youth Halaqa',
    date: 'Saturday',
    time: '6:00 PM',
    location: 'Classroom B',
    description: 'Interactive study circle for youth.',
  },
  {
    id: 'evt-3',
    title: 'Community Iftar',
    date: 'Upcoming',
    time: 'Sunset',
    location: 'Community Hall',
    description: 'Open iftar for families and neighbors.',
  },
];

/**
 * Events + programs from Muslimoon (GET /events and /programs, in parallel).
 * Returns live items when either list has data; otherwise the labelled samples.
 */
export async function fetchEventsResult(): Promise<ListResult<EventItem>> {
  const [events, programs] = await Promise.allSettled([
    getJson<MuslimoonEventsResponse>('events'),
    getJson<MuslimoonProgramsResponse>('programs'),
  ]);
  const evs = events.status === 'fulfilled' && Array.isArray(events.value?.events) ? events.value.events : [];
  const progs = programs.status === 'fulfilled' && Array.isArray(programs.value?.programs) ? programs.value.programs : [];
  const items = [
    ...evs.flatMap((r, i) => normalizeEvent(r, i, 'event') ?? []),
    ...progs.flatMap((r, i) => normalizeEvent(r, i, 'class') ?? []).map((e) => ({ ...e, id: `class-${e.id}` })),
  ];
  if (items.length > 0) return { items, source: 'live' };
  const failed = [events, programs].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
  return { items: SAMPLE_EVENTS, source: 'sample', error: failed ? errorText(failed.reason) : undefined };
}

/** Back-compat: just the items. */
export async function fetchEvents(): Promise<EventItem[]> {
  return (await fetchEventsResult()).items;
}

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
    const items = (Array.isArray(raw?.campaigns) ? raw.campaigns : []).flatMap((c, i) => normalizeCampaign(c, i) ?? []);
    if (items.length > 0) return { items, source: 'live' };
    return { items: DEFAULT_CAUSES, source: 'sample' };
  } catch (e) {
    return { items: DEFAULT_CAUSES, source: 'sample', error: errorText(e) };
  }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return (await fetchCampaignsResult()).items;
}

export type ServiceCategory = { id: string; name: string; description?: string };
type MuslimoonServicesResponse = {
  services: unknown[];
  categories: unknown[];
  instructors: unknown[];
  organization: MuslimoonOrganization;
};

/**
 * GET /v1/<org>/services — AHC has no services yet, but the category list is
 * populated (and duplicated server-side, so it is de-duplicated by name here).
 * Not shown in the UI yet; ready for a "Services" section.
 */
export async function fetchServices(): Promise<{ services: unknown[]; categories: ServiceCategory[] }> {
  const raw = await getJson<MuslimoonServicesResponse>('services');
  const seen = new Set<string>();
  const categories = (Array.isArray(raw?.categories) ? raw.categories : []).flatMap((c) => {
    if (!c || typeof c !== 'object') return [];
    const o = c as Raw;
    const name = pickStr(o, 'name');
    if (!name || seen.has(name.toLowerCase())) return [];
    seen.add(name.toLowerCase());
    return [{ id: pickStr(o, 'id') ?? name, name, description: pickStr(o, 'description') }];
  });
  return { services: Array.isArray(raw?.services) ? raw.services : [], categories };
}

/** GET /v1/<org>/articles — raw list (empty for AHC today). */
export async function fetchArticles(): Promise<unknown[]> {
  const raw = await getJson<MuslimoonArticlesResponse>('articles');
  return Array.isArray(raw?.articles) ? raw.articles : [];
}

/**
 * Pledge creation — no public Muslimoon endpoint exists. Donations go to the
 * IRM checkout (src/config/donations.ts); this stays a no-op until a pledge /
 * donor-record endpoint is confirmed.
 */
export async function createPledge(input: PledgeInput): Promise<PledgeResult> {
  void input;
  return { id: `local-${Date.now()}`, status: 'mock' };
}
