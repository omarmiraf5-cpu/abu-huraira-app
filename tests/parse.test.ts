/**
 * Tolerant parsing: Muslimoon payloads with missing/extra fields, nulls, odd
 * types and different date formats must never throw.
 * Run: npm test
 */
import { parseDateLoose, parseTimeRange, asArray, asNumber, pickStringList } from '@/src/api/parse';
import {
  normalizeEvent,
  normalizeAnnouncement,
  normalizeFormSchema,
  normalizeCampaign,
  demoPrograms,
  demoEvents,
  demoAnnouncements,
  singleWeekday,
  youtubeUrlFrom,
} from '@/src/api/muslimoon';
import { buildCheckoutUrl, checkoutHandoff } from '@/src/config/donations';
import { eventDateBadge } from '@/src/utils/events';

let fail = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? 'PASS ' : 'FAIL ') + m);
  if (!c) fail++;
};

// Dates seen in the wild
ok(parseDateLoose('2026-10-02T04:40:21.900532+00:00')?.date === '2026-10-02', 'ISO + microseconds + offset (announcement-bar created_at)');
ok(parseDateLoose('2026-10-02T03:00:00Z')?.date === '2026-10-01', 'UTC instant converts to the Toronto calendar day');
ok(parseDateLoose('2026-10-01T00:00:00.201295')?.minutes === 0, 'ISO without offset = masjid wall-clock (prayer-times last_updated)');
ok(parseDateLoose('2026-10-04')?.date === '2026-10-04', 'date only');
ok(parseDateLoose('10/04/2026')?.date === '2026-10-04', 'MM/DD/YYYY');
ok(parseDateLoose('Sunday, October 4th, 2026')?.date === '2026-10-04', 'long English date');
ok(parseDateLoose(1790981219)?.absolute === true, 'epoch seconds');
ok(parseDateLoose('2026-02-30') === undefined, 'impossible date rejected');
ok([null, undefined, {}, [], 'Every Friday', 'TBA', NaN].every((v) => parseDateLoose(v) === undefined), 'junk → undefined, no throw');

// Times
ok(parseTimeRange('7.45pm 8.45 pm')?.start === 19 * 60 + 45, '"7.45pm 8.45 pm"');
ok(parseTimeRange('6-8pm')?.end === 20 * 60, '"6-8pm" shares the meridiem');
ok(parseTimeRange('After Fajr') === undefined, 'prayer-relative labels stay labels');

// Helpers
ok(asArray({ items: [1] }).length === 1 && asArray(null).length === 0, 'asArray unwraps / defaults');
ok(asNumber('$350 / month') === 350 && asNumber('free') === undefined, 'asNumber');
ok(pickStringList({ c: [{ item: 'a' }, 'b', null, 3] }, 'c').join() === 'a,b,3', 'string lists from mixed arrays');

// Events / programs
const nasty: unknown[] = [null, 42, 'x', [], {}, { title: '' }, { name: { en: 'obj' } }, { title: 'Hidden', is_active: false }, { title: 'Archived', isArchived: true }];
ok(nasty.every((r, i) => normalizeEvent(r, i) === null), 'untitled / inactive / archived / non-objects → null');
const weird = normalizeEvent({ title: 'Weird', start_date: { y: 1 }, price: NaN, instructor: [1], curriculum: 'a\nb', registration: 'yes', extra: { deep: [1, 2] } }, 0, 'class');
ok(!!weird && weird.title === 'Weird' && weird.curriculum?.length === 2, 'wrong types and extra fields are ignored');
const camel = normalizeEvent({ id: 'c1', name: 'Camel', startDate: '2026-11-03', startTime: '18:30', locationName: 'Hall', instructorName: 'Sh. X', price: 0, registrationRequired: 'true', externalRegistrationLink: 'https://example.org/r' }, 0, 'event');
ok(camel?.startsAt === '2026-11-03T23:30:00.000Z' && camel.fee === 'Free' && camel.registration?.required === true, 'camelCase aliases; EST after DST ends');
const old = normalizeEvent({ name: 'Footsteps of the chosen', type: 'LONGTERM', pattern: 'Every Friday', time: '7.45pm 8.45 pm', price: 'Free', age: 'All', isArchived: false }, 0, 'class');
ok(old?.weekday === 5 && old.startMinutes === 1185 && old.category === 'Long-term', 'old AHC CMS shape (pattern/time/type)');
ok(normalizeEvent({ title: 'Weekend', schedule: 'Saturday & Sunday', time: '10am - 2pm' }, 0, 'class')?.weekday === undefined, 'multi-day patterns are not scheduled as a single weekday');
ok(singleWeekday('Wednesdays') === 3 && singleWeekday('Mon & Wed') === null, 'singleWeekday');

// Announcements (real announcement-bar item)
const ann = normalizeAnnouncement({ id: '9f6c', message: 'This is a test announcment', link_text: null, link_url: null, is_active: true, created_at: '2026-10-02T04:40:21.900532+00:00' }, 0);
ok(ann?.message === 'This is a test announcment' && ann.linkUrl === undefined, 'real announcement-bar item');
ok(normalizeAnnouncement({ message: 'x', link_url: 'javascript:alert(1)' }, 0)?.linkUrl === undefined, 'non-http links dropped');
ok(normalizeAnnouncement({ message: 'off', is_active: false }, 0) === null, 'inactive announcement hidden');

// Forms
ok(normalizeFormSchema({ error: 'Form not found' }) === null, 'error payload → null (no form)');
const js = normalizeFormSchema({ schema: { properties: { email: { title: 'Email', type: 'email' }, kids: { title: 'Kids', type: 'number' } }, required: ['email'] } });
ok(js?.fields.find((f) => f.id === 'email')?.required === true, 'JSON-schema style forms');
const f2 = normalizeFormSchema({ data: { questions: [{ question: 'Pick', type: 'multiple_choice', choices: 'A,B' }, { label: 'Odd', type: 'signature' }] } });
ok(f2?.fields[0].type === 'radio' && f2.fields[0].options.length === 2 && f2.fields[1].type === 'text', 'aliases + unknown types fall back to text');

// Campaigns
ok(normalizeCampaign({ title: 'Zakat', goal_amount: '0' }, 0)?.goal === undefined, 'zero goal → no progress bar');

// Demo data goes through the same normalisers
ok(demoPrograms().length === 10 && demoPrograms().every((p) => p.demo && p.kind === 'class'), '10 website-based demo programs');
const de = demoEvents(new Date('2026-10-02T22:50:00Z'));
ok(de.length === 3 && de[0].title === 'Footsteps of the Chosen' && !!de[0].startsAt, 'demo "this week" sessions are dated and upcoming');
ok(demoAnnouncements().length === 3, '3 website community announcements');

// Date badges never imply a single day for multi-day schedules
ok(eventDateBadge('Every Friday').main === 'FRI', 'weekly single day badge');
ok(eventDateBadge('Saturday & Sunday').main === '2×', 'two-day badge');
ok(eventDateBadge('Monday – Thursday').main === '4×', 'day range badge');
ok(eventDateBadge('Mon & Wed or Tue & Thu').main === '2×', 'alternative tracks badge');
ok(eventDateBadge('Fri, Oct 2').top === 'OCT', 'dated session badge');

// YouTube
ok(youtubeUrlFrom('@AbuHurairaCenter') === 'https://www.youtube.com/@AbuHurairaCenter', 'handle → URL');
ok(youtubeUrlFrom('youtube.com/abuhurairacenter') === 'https://youtube.com/abuhurairacenter', 'bare domain → https');
ok(youtubeUrlFrom('https://evil.example/youtube') === undefined, 'non-YouTube URL rejected');

// IRM handoff (placeholders → nothing appended yet)
const h = checkoutHandoff({ amount: 50, frequency: 'monthly', campaignId: 'zakat', name: ' A ', email: 'a@b.co' });
ok(h.frequency === 'm' && h.campaign === 'zakat-al-maal' && h.name === 'A' && h.amount === 50, 'handoff carries name, email, amount, campaign, frequency');
ok(checkoutHandoff({ amount: 10 }).frequency === undefined, 'one-time sends no frequency code');
ok(buildCheckoutUrl({ amount: 50, frequency: 'weekly', name: 'A', email: 'a@b.co' }) === 'https://app.irm.io/abuhuraira.org/e/checkout', 'no params appended until names are confirmed');

console.log(fail ? `${fail} FAILED` : 'ALL PASSED');
if (fail) process.exit(1);
