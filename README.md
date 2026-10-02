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
| Home | `app/(tabs)/index.tsx` | Dashboard: greeting, next-prayer hero, today strip, quick actions, upcoming events, donate CTA |
| Prayer | `app/(tabs)/prayer.tsx` | Live Muslimoon prayer times (mock fallback), next-prayer highlight |
| Events | `app/(tabs)/events.tsx` | Stub event cards (live endpoint exists but AHC list is empty) |
| Donate | `app/(tabs)/donate.tsx` | 2-step flow → checkout |
| More | `app/(tabs)/more.tsx` | About / contact stubs |

Supporting code:

- `src/api/muslimoon.ts` — Muslimoon client (`/v1/<org_id>/...`); live prayer times, other calls still mocked
- `src/utils/prayerTime.ts` — time parsing, Toronto-time helpers, sunset estimate
- `docs/muslimoon-api.md`, `docs/samples/` — endpoint findings and sample responses
- `src/config/donations.ts` — IRM checkout URL builder
- `src/theme/tokens.ts` — design system (colour ramp, spacing, radius, type scale, elevation, motion)
- `src/components/*` — design-system components (Screen, HeroHeader, Card, Button, SectionHeader, ListGroup, TextField, EmptyState, …)
- `src/hooks/usePrayerTimes.ts`, `src/utils/prayerSchedule.ts` — shared prayer-time loading + next-prayer logic (Home and Prayer)
- `docs/screenshots/premium-*.png` — 390×844 web screenshots of the redesign (web shows sample prayer times because of CORS)

## Reminders (notifications)

Local notifications via `expo-notifications` — scheduled on the device, no server needed, work in Expo Go and builds (not on web).

- **Salah:** at adhan, or 10/15/20/30 min before iqamah; per-prayer switches; Jumu'ah replaces Dhuhr on Fridays. Maghrib uses each day's estimated sunset.
- **Classes & events:** 1 hour or 1 day before, for live Muslimoon events/programs that have a date+time or a weekly day+time.
- **Safety rules:** only live data is scheduled (never sample times/previews); a failed fetch keeps existing reminders; times are Toronto wall-clock converted per day (DST-safe).
- **Rolling window:** 7 days of salah (≤ 40) + events (≤ 20), under iOS's 64-pending limit; re-planned on launch, on return to foreground (every 10 min max) and on settings change.
- Code: `src/notifications/` — `schedule.ts` (pure planner, tested by `npm test`), `reminders.ts` (permissions, Android channels "Salah reminders"/"Classes & events", scheduling), `prefs.ts` (saved settings), `ReminderSync.tsx`. Screen: `app/notifications.tsx` (More → Notifications, Home bell, Home prompt).
- Android: `SCHEDULE_EXACT_ALARM` is declared so reminders fire on the minute; Google Play asks apps using it to declare why in the Play Console (prayer-time alarms).
- **Not yet:** push notifications for new announcements (needs a server sending pushes, e.g. Firebase Cloud Functions + Expo push tokens, and a development build on Android).

## Donations

Config in `src/config/donations.ts` — **IRM** (irm.io):

- Checkout: `https://app.irm.io/abuhuraira.org/e/checkout` (provided by AHC, 2026-10-01)
- Currency / locale: CAD, en-CA

Flow: pick cause + amount (+ name/email/phone) → confirm → open IRM checkout in the in-app browser (SFSafariViewController / Chrome Custom Tabs), so card details never touch the app.

- **Pre-fill:** IRM's query parameter names aren't confirmed, so nothing is appended yet and donors choose fund + amount on IRM's page. Set `prefillParams` in `donations.ts` once IT/IRM confirm the names.
- Donor name/email/phone are never put in the checkout URL.
- The "mock logged-in profile" toggle is development-only (`__DEV__`) until real sign-in ships.

## Blockers

1. **Muslimoon data** — prayer times are live. `events`, `programs`, `articles` and `campaigns` endpoints work but are empty for AHC; the app switches to real data automatically once AHC publishes in Muslimoon (see `docs/muslimoon-api.md`). `forms` needs auth. No CORS headers, so the web build always shows samples.
2. **IRM pre-fill parameters** — confirm with IT/IRM which query params pre-select fund and amount.
3. **Sign-in** — real donor login (and in-app account deletion, required by Apple) still to build.
4. **Brand book** — MasjidOps capture is in use; formal brand book still pending (see BRANDING.md).
5. **Verified contact details** — More tab address/phone are stubs pending confirmation.

## Scripts

| Command | Purpose |
| --- | --- |
| `npx expo start` | Dev server |
| `npm run android` / `ios` / `web` | Platform targets |
| `npm run typecheck` | `tsc --noEmit` |

## License

Private / AHC use unless otherwise stated.
