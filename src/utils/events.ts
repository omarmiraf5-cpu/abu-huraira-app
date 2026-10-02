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
  const day = WEEKDAYS.find((w) => lower.includes(w));
  if (day) {
    return { top: /every|weekly/.test(lower) ? 'WEEKLY' : 'NEXT', main: day.slice(0, 3).toUpperCase() };
  }
  return { top: 'SOON', main: null };
}

export function eventIcon(title: string): IconName {
  const t = title.toLowerCase();
  if (/khutbah|jumu|salah|prayer/.test(t)) return 'mosque';
  if (/halaqa|class|study|quran|qur'an|youth|lecture/.test(t)) return 'book-outline';
  if (/iftar|dinner|lunch|food|bbq/.test(t)) return 'restaurant-outline';
  if (/sister|family|kids|children/.test(t)) return 'people-outline';
  return 'calendar-outline';
}
