/**
 * Small, dependency-free "safe parse" helpers for Muslimoon payloads.
 *
 * Rule: nothing in here throws. Every helper takes `unknown` and returns a
 * value or `undefined`, so a missing field, a `null`, an extra field, a number
 * where a string was expected, or a date in an unexpected format can never
 * crash a screen. Normalisers in muslimoon.ts are built on these.
 */

export type Raw = Record<string, unknown>;

export function isRecord(v: unknown): v is Raw {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Object or an empty object (never throws on null / arrays / primitives). */
export function asRecord(v: unknown): Raw {
  return isRecord(v) ? v : {};
}

/** Array or an empty array. Also unwraps `{ data: [...] }` / `{ items: [...] }`. */
export function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (isRecord(v)) {
    for (const k of ['data', 'items', 'results']) if (Array.isArray(v[k])) return v[k] as unknown[];
  }
  return [];
}

/** Trimmed non-empty string; numbers are stringified; everything else → undefined. */
export function asString(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t : undefined;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

/** Finite number from a number or a numeric-looking string ("$350 / month" → 350). */
export function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const m = v.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (m) {
      const n = Number.parseFloat(m[0]);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

/** Boolean from true/false, 1/0, "true"/"false", "yes"/"no". */
export function asBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(t)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(t)) return false;
  }
  return undefined;
}

/** First usable string among several possible keys (field-name aliases). */
export function pickStr(o: Raw, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = asString(o[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

export function pickNum(o: Raw, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = asNumber(o[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

export function pickBool(o: Raw, ...keys: string[]): boolean | undefined {
  for (const k of keys) {
    const v = asBool(o[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

/** List of strings from ["a","b"], [{item:"a"}], [{name:"a"}] or "a\nb" / "a, b". */
export function pickStringList(o: Raw, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) {
      const out = v.flatMap((x) => {
        const s = asString(x) ?? (isRecord(x) ? pickStr(x, 'item', 'name', 'title', 'label', 'text', 'value') : undefined);
        return s ? [s] : [];
      });
      if (out.length) return out;
    } else if (typeof v === 'string' && v.trim()) {
      const parts = v.split(/\r?\n|;/).map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      if (parts.length) return parts;
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export type ParsedDate = {
  /** Calendar date in the masjid's zone, YYYY-MM-DD */
  date: string;
  year: number;
  month: number;
  day: number;
  /** Minutes since midnight when the value carried a time, else null */
  minutes: number | null;
  /** True when the value carried an explicit UTC offset / Z (an absolute instant) */
  absolute: boolean;
  /** The instant, when one can be derived without a timezone guess */
  instant?: Date;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');

function valid(y: number, m: number, d: number) {
  if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function make(y: number, m: number, d: number, minutes: number | null, absolute = false, instant?: Date): ParsedDate | undefined {
  if (!valid(y, m, d)) return undefined;
  return { date: `${y}-${pad(m)}-${pad(d)}`, year: y, month: m, day: d, minutes, absolute, instant };
}

/** Calendar parts of an instant as seen in `timeZone`. */
function partsIn(instant: Date, timeZone: string) {
  try {
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const p: Record<string, string> = {};
    for (const x of f.formatToParts(instant)) p[x.type] = x.value;
    return { y: Number(p.year), m: Number(p.month), d: Number(p.day), minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
  } catch {
    return { y: instant.getUTCFullYear(), m: instant.getUTCMonth() + 1, d: instant.getUTCDate(), minutes: instant.getUTCHours() * 60 + instant.getUTCMinutes() };
  }
}

/**
 * Tolerant date parser. Accepts everything seen so far from Muslimoon and the
 * old AHC CMS, and a few likely extras:
 *   "2026-10-02"                         date only
 *   "2026-10-01T00:00:00.201295"         no offset → masjid wall-clock
 *   "2026-10-02T04:40:21.900532+00:00"   microseconds + offset (Hermes-safe)
 *   "2026-05-01T16:31:06.227Z"           UTC
 *   "2026-10-02 18:30:00"                space separator
 *   "10/04/2026"                         MM/DD/YYYY (North American)
 *   "October 4, 2026" / "Oct 4 2026" / "Sunday, October 4th, 2026"
 *   1790981219 / 1790981219000           epoch seconds / ms
 * Returns undefined (never throws) for anything else, e.g. "Every Friday".
 */
export function parseDateLoose(value: unknown, timeZone = 'America/Toronto'): ParsedDate | undefined {
  try {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return undefined;
      const p = partsIn(value, timeZone);
      return make(p.y, p.m, p.d, p.minutes, true, value);
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const ms = value < 1e11 ? value * 1000 : value;
      return parseDateLoose(new Date(ms), timeZone);
    }
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    if (!s) return undefined;

    if (/^\d{10}(\d{3})?$/.test(s)) return parseDateLoose(Number(s), timeZone);

    // ISO-like
    const iso = s.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i,
    );
    if (iso) {
      const [, y, mo, d, hh, mm, ss, frac, tz] = iso;
      if (tz && hh !== undefined) {
        const ms = frac ? frac.slice(0, 3).padEnd(3, '0') : '000';
        const off = tz.toUpperCase() === 'Z' ? 'Z' : tz.length === 5 ? `${tz.slice(0, 3)}:${tz.slice(3)}` : tz;
        const instant = new Date(`${y}-${pad(+mo)}-${pad(+d)}T${pad(+hh)}:${mm}:${ss ?? '00'}.${ms}${off}`);
        if (Number.isNaN(instant.getTime())) return undefined;
        const p = partsIn(instant, timeZone);
        return make(p.y, p.m, p.d, p.minutes, true, instant);
      }
      const minutes = hh !== undefined ? Number(hh) * 60 + Number(mm) : null;
      return make(Number(y), Number(mo), Number(d), minutes);
    }

    // MM/DD/YYYY (or DD/MM/YYYY when the first part can't be a month)
    const slash = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (slash) {
      let [a, b] = [Number(slash[1]), Number(slash[2])];
      if (a > 12 && b <= 12) [a, b] = [b, a];
      return make(Number(slash[3]), a, b, null);
    }

    // "October 4, 2026", "Sun, Oct 4th 2026", "4 October 2026"
    const lower = s.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1');
    const mIdx = MONTHS.findIndex((m) => new RegExp(`\\b${m}[a-z]*\\.?\\b`).test(lower));
    const year = lower.match(/\b(19|20|21)\d{2}\b/);
    if (mIdx >= 0 && year) {
      const afterMonth = lower.match(new RegExp(`\\b${MONTHS[mIdx]}[a-z]*\\.?\\s+(\\d{1,2})\\b`));
      const beforeMonth = lower.match(new RegExp(`\\b(\\d{1,2})\\s+${MONTHS[mIdx]}`));
      const day = afterMonth ? Number(afterMonth[1]) : beforeMonth ? Number(beforeMonth[1]) : NaN;
      if (Number.isFinite(day)) return make(Number(year[0]), mIdx + 1, day, null);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse a free-text time range into start/end minutes. Handles
 * "6:00 PM – 8:00 PM", "6pm-8pm", "7.45pm 8.45 pm", "9:00AM - 3:00PM",
 * "10am - 2pm", "18:30". Words like "After Fajr" → undefined (kept as label).
 */
export function parseTimeRange(value: unknown): { start: number; end?: number } | undefined {
  const s = asString(value);
  if (!s) return undefined;
  const re = /(\d{1,2})(?:[:.](\d{2}))?\s*([ap]\.?\s?m\.?)?/gi;
  const found: { h: number; m: number; mer?: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) && found.length < 2) {
    const mer = m[3]?.replace(/[.\s]/g, '').toLowerCase();
    const h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h > 23 || min > 59) continue;
    if (!mer && !m[2]) {
      // bare number: only accept as part of a range like "6-8pm"
      found.push({ h, m: min });
      continue;
    }
    found.push({ h, m: min, mer });
  }
  if (!found.length) return undefined;
  // Share a trailing meridiem ("6-8pm") backwards.
  if (found.length === 2 && !found[0].mer && found[1].mer) found[0].mer = found[1].mer;
  const toMin = (x: { h: number; m: number; mer?: string }) => {
    let h = x.h;
    if (x.mer === 'am' && h === 12) h = 0;
    else if (x.mer === 'pm' && h < 12) h += 12;
    return h * 60 + x.m;
  };
  if (!found[0].mer && !/:\d{2}/.test(s)) return undefined; // "5" alone isn't a time
  const start = toMin(found[0]);
  const end = found[1] ? toMin(found[1]) : undefined;
  return { start, end: end !== undefined && end > start ? end : undefined };
}

/** "18:30"-style minutes → "6:30 PM". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
