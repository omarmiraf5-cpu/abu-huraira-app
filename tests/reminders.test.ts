import { planPrayerReminders, planEventReminders, DEFAULT_PREFS, type NotificationPrefs } from '@/src/notifications/schedule';
import { normalizeEvent, mockPrayerTimes, type PrayerTimesResult } from '@/src/api/muslimoon';
const live: PrayerTimesResult = { ...mockPrayerTimes(), source: 'live',
  daily: [
    { key: 'fajr', name: 'Fajr', adhan: '6:00 AM', iqamah: '5:15 AM' },
    { key: 'dhuhr', name: 'Dhuhr', adhan: '1:30 PM', iqamah: '1:45 PM' },
    { key: 'asr', name: 'Asr', adhan: '5:00 PM', iqamah: '5:15 PM' },
    { key: 'maghrib', name: 'Maghrib', adhan: 'Sunset', iqamah: '+5 mins' },
    { key: 'isha', name: 'Isha', adhan: '8:00 PM', iqamah: '8:15 PM' }],
  jummah: [{ key: 'jummah1', name: "Jumu'ah", adhan: '1:30 PM', iqamah: '2:00 PM' }] } as any;
const on: NotificationPrefs = { ...DEFAULT_PREFS, prayer: { ...DEFAULT_PREFS.prayer, enabled: true }, events: { enabled: true, lead: 60 } };
const tz = (d: Date) => d.toLocaleString('en-US', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
let fail = 0; const ok = (c: boolean, m: string) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

// Thu Oct 1 2026, 3:38 PM Toronto = 19:38Z
const now = new Date('2026-10-01T19:38:00Z');
const p = planPrayerReminders(live, on, now);
console.log(p.slice(0, 7).map(r => `${tz(r.at)} | ${r.title} | ${r.body}`).join('\n'));
ok(p[0].title.startsWith('Asr') && tz(p[0].at).includes('5:00'), 'first reminder is today\'s Asr at 5:00 PM');
ok(!p.some(r => r.id === 'prayer:2026-10-01:dhuhr'), 'past prayers today are skipped');
ok(p.some(r => r.id === 'prayer:2026-10-02:jummah') && !p.some(r => r.id === 'prayer:2026-10-02:dhuhr'), "Friday: Jumu'ah replaces Dhuhr");
ok(p.length === 33, `7 days of reminders, minus 2 already past today (got ${p.length})`);
const mg1 = p.find(r => r.id === 'prayer:2026-10-01:maghrib')!, mg7 = p.find(r => r.id === 'prayer:2026-10-07:maghrib')!;
ok(mg1.title.includes('≈') && tz(mg7.at) !== tz(mg1.at).replace('Oct 1', 'Oct 7'), 'Maghrib follows each day\'s sunset (estimated)');
ok(planPrayerReminders({ ...live, source: 'mock' }, on, now).length === 0, 'sample prayer times never schedule reminders');
ok(planPrayerReminders(live, DEFAULT_PREFS, now).length === 0, 'nothing scheduled until the user turns reminders on');
const before = planPrayerReminders(live, { ...on, prayer: { ...on.prayer, mode: 'beforeIqamah', lead: 15 } }, now);
ok(tz(before[0].at).includes('5:00 PM') && before[0].body.startsWith('Iqamah in 15'), 'before-iqamah mode: Asr iqamah 5:15 → reminder 5:00');
const noFajr = planPrayerReminders(live, { ...on, prayer: { ...on.prayer, prayers: { ...on.prayer.prayers, fajr: false } } }, now);
ok(!noFajr.some(r => r.data.key === 'fajr'), 'per-prayer switch removes Fajr');
// DST: Nov 1 2026 Toronto falls back. Isha 8:00 PM before and after must stay 8:00 PM local.
const dst = planPrayerReminders(live, on, new Date('2026-10-29T12:00:00Z'));
const i31 = dst.find(r => r.id === 'prayer:2026-10-31:isha')!, i1 = dst.find(r => r.id === 'prayer:2026-11-01:isha')!;
ok(tz(i31.at).includes('8:00 PM') && tz(i1.at).includes('8:00 PM') && i1.at.getTime() - i31.at.getTime() === 25 * 3600e3, 'DST fall-back: Isha stays 8:00 PM Toronto (25h apart)');
ok(i31.at.toISOString() === '2026-11-01T00:00:00.000Z' && i1.at.toISOString() === '2026-11-02T01:00:00.000Z', 'DST instants are exact UTC');

// Events
const ev = [
  normalizeEvent({ id: 'e1', title: 'Tafsir Night', start_date: '2026-10-09', start_time: '7:00 PM', location: 'Main Hall' }, 0, 'event'),
  normalizeEvent({ id: 'p1', name: 'Quran Class', schedule: 'Every Sunday', time: '10:00 AM' }, 1, 'class'),
  normalizeEvent({ id: 'e2', title: 'Past Iftar', start_date: '2026-09-20T23:00:00Z' }, 2, 'event'),
  normalizeEvent({ id: 'e3', title: 'Undated', date: 'Upcoming' }, 3, 'event'),
].filter(Boolean) as any[];
const e = planEventReminders({ items: ev, source: 'live' }, on, now);
console.log(e.map(r => `${tz(r.at)} | ${r.title} | ${r.body}`).join('\n'));
ok(e.some(r => r.title === 'Event: Tafsir Night' && tz(r.at).includes('Oct 9') && tz(r.at).includes('6:00 PM')), 'dated event: 1 hour before (6:00 PM, Oct 9)');
ok(e.filter(r => r.title === 'Class: Quran Class').length === 2, 'weekly class: each Sunday in the 14-day window (Oct 4, Oct 11)');
ok(!e.some(r => /Past|Undated/.test(r.title)), 'past and undated events are skipped');
ok(planEventReminders({ items: ev, source: 'sample' }, on, now).length === 0, 'preview events never schedule reminders');
const day = planEventReminders({ items: ev, source: 'live' }, { ...on, events: { enabled: true, lead: 1440 } }, now);
ok(day[0].body.startsWith('Tomorrow'), 'day-before mode wording');
ok(p.length + e.length <= 64, `total within iOS 64 limit (${p.length + e.length})`);
console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
