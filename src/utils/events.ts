import type { IconName } from '@/src/components/Icon';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type DateBadge = { top: string; main: string | null };

/**
 * Turns an event `date` string into a compact calendar badge.
 * Handles ISO dates (future live data) and the sample labels
 * ("Every Friday", "Saturday", "Upcoming").
 */
export function eventDateBadge(date: string): DateBadge {
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      const month = new Intl.DateTimeFormat('en-CA', { month: 'short', timeZone: 'UTC' }).format(d);
      return { top: month.replace('.', '').toUpperCase(), main: String(d.getUTCDate()) };
    }
  }
  const lower = date.toLowerCase();
  // "Fri, Oct 2" / "Oct 2, 2026" → OCT 2
  const md = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/);
  if (md) return { top: md[1].toUpperCase(), main: md[2] };
  // Single weekday ("Every Friday", "Saturday") → WEEKLY FRI / NEXT SAT.
  // Several days ("Saturday & Sunday", "Monday – Thursday", "Mon & Wed or
  // Tue & Thu") → WEEKLY 2× / 4×, so the badge never implies just one day.
  const DAY_RE = /\b(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/g;
  const firstTrack = lower.split(/\s+or\s+/)[0];
  const days = (firstTrack.match(DAY_RE) ?? []).map((d) => WEEKDAYS.findIndex((w) => w.startsWith(d.slice(0, 3))));
  if (days.length === 1) {
    return { top: /every|weekly|days\b/.test(lower) ? 'WEEKLY' : 'NEXT', main: WEEKDAYS[days[0]].slice(0, 3).toUpperCase() };
  }
  if (days.length > 1) {
    const isRange = days.length === 2 && /[–—-]|\bto\b|through|thru/.test(firstTrack);
    const count = isRange ? ((days[1] - days[0] + 7) % 7) + 1 : new Set(days).size;
    return { top: 'WEEKLY', main: `${count}×` };
  }
  if (/weekly|every/.test(lower)) return { top: 'WEEKLY', main: null };
  return { top: 'SOON', main: null };
}

export function eventIcon(title: string): IconName {
  const t = title.toLowerCase();
  if (/khutbah|jumu|salah|prayer/.test(t)) return 'mosque';
  if (/sister|muslimah/.test(t)) return 'people-outline';
  if (/halaqa|class|study|quran|qur'an|youth|lecture|tafs|hifd|hifth|school|seerah|attabuk|kalim/.test(t)) return 'book-outline';
  if (/iftar|dinner|lunch|food|bbq/.test(t)) return 'restaurant-outline';
  if (/sister|family|kids|children/.test(t)) return 'people-outline';
  return 'calendar-outline';
}
