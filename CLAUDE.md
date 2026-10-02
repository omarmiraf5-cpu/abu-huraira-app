@AGENTS.md

# Abu Huraira Center (AHC) app — project context

Built by Omar Abdullahi (Buraaqtech) for Abu Huraira Center, North York, ON (abuhuraira.org). Client contact: Sheikh Amaar. Repo will be owned by AHC. **Deadline: Nov 30, 2026.**

## Stack
- Expo SDK 57, React Native 0.86, TypeScript, Expo Router (tabs: Home, Prayer, Events, Donate, More + `app/notifications.tsx`).
- Data: Muslimoon public API, org **`e8a7eda8-3c55-4a9c-9b8f-9c9d37687534`** (AHC). `1cd66547-…` is Muslimoon's *sandbox* org ("mymasjidsandbox") — don't use it for AHC.
- Planned backend: Firebase (Firestore, Cloud Functions, Auth). Not built yet.
- Checks: `npx tsc --noEmit`, `npm test` (reminder planner), `npx expo-doctor`.

## Done so far
- Premium redesign: custom duotone icon set (`src/components/icons/glyphs.ts`, `Glyph.tsx`), jewel icon tiles (`JewelIcon.tsx`, all white-glyph tones ≥ 3:1), floating glass tab bar (expo-blur), new app icon + Android adaptive icons.
- Device-optimized: compact phones (<360px), tablets (content cap 680, tab bar max 520), keyboard handling, font-scale caps (`src/hooks/useResponsive.ts`). iPad `requireFullScreen: true`.
- Prayer times live from Muslimoon (web falls back to samples — API has no CORS).
- Events + programs + campaigns read live (`src/api/muslimoon.ts`); AHC's lists are currently empty so labelled samples show. Defensive normalizers accept common field aliases — tighten once real samples exist (save to `docs/samples/`).
- Donations open AHC's IRM checkout `https://app.irm.io/abuhuraira.org/e/checkout` (`src/config/donations.ts`). No PII in URLs. Pre-fill params unknown — set `prefillParams` once IRM/IT confirm. Mock login toggle is `__DEV__` only.
- Local reminders (`src/notifications/`): salah at adhan or N min before iqamah, per prayer, Jumu'ah replaces Dhuhr on Fridays, class/event reminders 1h or 1 day before. Live data only; Toronto wall-clock → UTC (DST-safe); 7-day rolling window, ≤ 60 pending (iOS limit 64). Android `SCHEDULE_EXACT_ALARM` declared (needs Play Console declaration).
- Sharing: `SHARING.md` (web preview link, `npm run share` tunnel for Expo Go, `eas.json` preview/production builds).
- Brand: `BRANDING.md`; a "Abu Huraira Center App" design system was published for Sheikh Amaar's sign-off. Jewel/sky tones are additions pending approval; formal AHC brand book still pending.

## Muslimoon endpoints (see docs/muslimoon-api.md)
prayer-times ✅ · events ✅ (empty) · programs ✅ (empty) · articles ✅ (empty) · campaigns ✅ (empty) · services ✅ (categories only, duplicated) · forms 🔒 401 (needs auth) · settings 500 · announcements 404.
Data issue to raise with AHC: Fajr iqamah (5:15 AM) is earlier than adhan (6:00 AM).

## Still to build (Nov 30 scope)
1. **Firebase backend** — unlocks: push notifications for announcements, YouTube latest videos (API key server-side), live-video detector (scheduled function checking YouTube → push), proxy for authenticated Muslimoon calls (forms/registrations). Secrets live only in Firebase, never in `EXPO_PUBLIC_*`.
2. Sign-in (donor login) + in-app account deletion (Apple requirement).
3. POST registrations (likely Muslimoon `forms`; waiting on how to authenticate).
4. Announcements (Muslimoon has none — use articles or Firestore).
5. Multi-language: Arabic, Somali, Urdu (i18n + RTL for Arabic/Urdu). Omar can supply Arabic/Somali.
6. Tax receipts via IRM (ask IT whether IRM has an API or donor portal link).
7. Offline mode (cache last prayer times/events on device).
8. Social media links (More tab) — waiting on handles.
9. "Quran app demo" — scope unclear; ask Sheikh Amaar.

## Open questions for AHC / IT
- IRM: query params to pre-select fund + amount? Tax-receipt API?
- Muslimoon: how to authenticate `/forms` (API key/token)? Fix Fajr data. Publish events/campaigns.
- Verified address/phone for the More tab; social handles; Quran demo scope.
- Expo account: create an organization for AHC and link the project there (`npx eas-cli@latest init`).
