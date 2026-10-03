# Abu Huraira Center (AHC) Mobile

Expo (React Native) + Expo Router + TypeScript app for Abu Huraira Center.

## Stack

- Expo SDK (latest stable scaffolded here)
- Expo Router (file-based tabs)
- TypeScript
- React Native only (not Capacitor / Ionic)
- Brand fonts via `expo-google-fonts` (Playfair Display display face, Inter UI face, Amiri for Arabic)
- Icons via `@expo/vector-icons`, gradients via `expo-linear-gradient`, geometric pattern via `react-native-svg`, haptics via `expo-haptics`
- Checkout via `expo-web-browser`
- Backend: Firebase Cloud Functions, scaffolded in `functions/` (see `docs/firebase-backend.md`) — not deployed yet

## Sharing a preview

See [SHARING.md](./SHARING.md): a browser link, Expo Go on a phone (`npm run share`), or an installable test build (`eas.json`).

## Setup

```bash
cd ahc-mobile
npm install
npx expo start
```

Then open in Expo Go, iOS simulator, Android emulator, or press `w` for web.

Optional env (public only — never put secrets in the client):

```bash
# .env
EXPO_PUBLIC_MUSLIMOON_BASE_URL=https://masajid.muslimoon.app
EXPO_PUBLIC_AHC_ORG_ID=e8a7eda8-3c55-4a9c-9b8f-9c9d37687534
```

Typecheck:

```bash
npx tsc --noEmit
```

## Brand

See [BRANDING.md](./BRANDING.md). Tokens: `src/theme/tokens.ts`. White logo: `assets/ahc-logo-white.png`.

Currency: **CAD**. Timezone: **America/Toronto**.

## App structure

| Tab | Route | Notes |
| --- | --- | --- |
| Home | `app/(tabs)/index.tsx` | Dashboard: greeting, next-prayer hero, today strip, quick actions, announcements, upcoming events, Watch live, donate CTA |
| Prayer | `app/(tabs)/prayer.tsx` | Live Muslimoon prayer times (mock fallback), next-prayer highlight |
| Events | `app/(tabs)/events.tsx` | Live events + programs; while AHC's lists are empty, a labelled preview built from abuhuraira.org (featured, This week, Classes & programs) |
| Donate | `app/(tabs)/donate.tsx` | 2-step flow (cause, amount, frequency, details) → IRM checkout |
| More | `app/(tabs)/more.tsx` | About, contact (CMS or website fallback), Watch (YouTube), Notifications |
| Event detail | `app/event/[id].tsx` | Schedule, fee, audience, curriculum, registration (link or form preview), contacts |

Supporting code:

- `src/api/muslimoon.ts` — Muslimoon client (`/v1/<org_id>/...`): prayer times, events/programs, announcement-bar, org-settings, campaigns, services, articles, forms (read-only); tolerant normalisers with demo fallback
- `src/api/parse.ts` — never-throw parsing helpers (dates in many formats, time ranges); `src/data/demo/` — preview data from abuhuraira.org
- `src/components/forms/FormRenderer.tsx` — renders Muslimoon public forms (submission off until the API is documented)
- `src/utils/prayerTime.ts` — time parsing, Toronto-time helpers, sunset estimate
- `docs/muslimoon-api.md`, `docs/samples/` — endpoint findings and sample responses
- `src/config/donations.ts` — IRM checkout URL builder
- `src/theme/tokens.ts` — design system (colour ramp, spacing, radius, type scale, elevation, motion)
- `src/components/*` — design-system components (Screen, HeroHeader, Card, Button, SectionHeader, ListGroup, TextField, EmptyState, …)
- `src/hooks/usePrayerTimes.ts`, `src/utils/prayerSchedule.ts` — shared prayer-time loading + next-prayer logic (Home and Prayer)
- `docs/screenshots/premium-*.png` — 390×844 web screenshots of the redesign (web shows sample prayer times because of CORS)
- `docs/screenshots/amaar-*.png` — events preview, program detail + form, donate frequency/confirm, home, more
- `functions/`, `firebase.json`, `firestore.rules` — Firebase backend (push notifications, YouTube, Muslimoon forms proxy); see `docs/firebase-backend.md`

## Reminders (notifications)

Local notifications via `expo-notifications` — scheduled on the device, no server needed, work in Expo Go and builds (not on web).

- **Salah:** at adhan, or 10/15/20/30 min before iqamah; per-prayer switches; Jumu'ah replaces Dhuhr on Fridays. Maghrib uses each day's estimated sunset.
- **Classes & events:** 1 hour or 1 day before, for live Muslimoon events/programs that have a date+time or a weekly day+time.
- **Safety rules:** only live data is scheduled (never sample times/previews); a failed fetch keeps existing reminders; times are Toronto wall-clock converted per day (DST-safe).
- **Rolling window:** 7 days of salah (≤ 40) + events (≤ 20), under iOS's 64-pending limit; re-planned on launch, on return to foreground (every 10 min max) and on settings change.
- Code: `src/notifications/` — `schedule.ts` (pure planner, tested by `npm test`), `reminders.ts` (permissions, Android channels "Salah reminders"/"Classes & events", scheduling), `prefs.ts` (saved settings), `ReminderSync.tsx`. Screen: `app/notifications.tsx` (More → Notifications, Home bell, Home prompt).
- Android: `SCHEDULE_EXACT_ALARM` is declared so reminders fire on the minute; Google Play asks apps using it to declare why in the Play Console (prayer-time alarms).
- **Push notifications** (new announcements, YouTube live): scaffolded in `functions/` (Firebase Cloud Functions + Expo push tokens), device registration wired up client-side (`src/notifications/pushToken.ts`, `PushTokenSync.tsx`) — not deployed yet, needs a real Firebase project and EAS project id (see `docs/firebase-backend.md`).

## Donations

Config in `src/config/donations.ts` — **IRM** (irm.io):

- Checkout: `https://app.irm.io/abuhuraira.org/e/checkout` (provided by AHC, 2026-10-01)
- Currency / locale: CAD, en-CA

Flow: pick cause + amount (+ name/email/phone) → confirm → open IRM checkout in the in-app browser (SFSafariViewController / Chrome Custom Tabs), so card details never touch the app.

- **Frequency:** One-time / Daily / Weekly / Monthly picker; shown on the confirm card.
- **Pre-fill:** per Amaar, IRM can take name, email, amount, campaign and frequency, but the param names aren't confirmed, so every `prefillParams` entry is `null` and nothing is appended; donors confirm on IRM's page. Set the names in `donations.ts` once Amaar sends a sample link (research notes in `docs/muslimoon-api.md`).
- Phone is never put in the URL; name/email only if IT approves setting those two params.
- **Receipts:** IRM issues tax receipts; the app has no receipt UI.
- The "mock logged-in profile" toggle is development-only (`__DEV__`) until real sign-in ships.

## Blockers

1. **Muslimoon data** — prayer times are live but **not final** (AHC is still migrating; Fajr iqamah is before athan). `events`, `programs`, `articles` and `campaigns` work but are empty; `announcement-bar` has one test item; the app switches to real data automatically (see `docs/muslimoon-api.md`). Public form submission isn't documented yet. Browsers are blocked by CORS, so the web build always shows previews.
2. **IRM pre-fill parameters** — need a sample checkout link: param names, frequency format, campaign ids.
3. **Sign-in** — real donor login (and in-app account deletion, required by Apple) still to build.
4. **Brand book** — MasjidOps capture is in use; formal brand book still pending (see BRANDING.md).
5. **Contact details** — More uses abuhuraira.org's address/phone/email until AHC fills Muslimoon `org-settings` contact info.
6. **Firebase backend** — scaffolded, not deployed; needs a real Firebase project, EAS project id, and YouTube API key/channel id (see `docs/firebase-backend.md`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npx expo start` | Dev server |
| `npm run android` / `ios` / `web` | Platform targets |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Reminder planner + tolerant-parsing tests |

## License

Private / AHC use unless otherwise stated.
