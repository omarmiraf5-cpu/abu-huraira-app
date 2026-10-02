@AGENTS.md

# Abu Huraira Center (AHC) app — project context

Built by Omar Abdullahi (Buraaqtech) for Abu Huraira Center, North York, ON (abuhuraira.org). Client contact: Sheikh Amaar. Repo will be owned by AHC. **Deadline: Nov 30, 2026.**

## Stack
- Expo SDK 57, React Native 0.86, TypeScript, Expo Router (tabs: Home, Prayer, Events, Donate, More + `app/notifications.tsx`).
- Data: Muslimoon public API, org **`e8a7eda8-3c55-4a9c-9b8f-9c9d37687534`** (AHC). `1cd66547-…` is Muslimoon's *sandbox* org ("mymasjidsandbox") — don't use it for AHC.
- Backend: Firebase (Firestore, Cloud Functions). Scaffolded in `functions/`
  (its own package.json/tsconfig, excluded from the root tsconfig) — not
  deployed yet, see `docs/firebase-backend.md` for the five functions and
  the setup steps still needed (real Firebase project, EAS project id,
  YouTube API key + channel id). Muslimoon `/forms` needs no auth (confirmed
  2026-10-02) — still needs real form ids once AHC creates forms in the CMS.
  Auth (donor sign-in) still not started.
- Checks: `npx tsc --noEmit`, `npm test` (reminder planner), `npx expo-doctor`
  at the repo root; `cd functions && npx tsc --noEmit` for the backend.

## Done so far
- Premium redesign: custom duotone icon set (`src/components/icons/glyphs.ts`, `Glyph.tsx`), jewel icon tiles (`JewelIcon.tsx`, all white-glyph tones ≥ 3:1), floating glass tab bar (expo-blur), new app icon + Android adaptive icons.
- Device-optimized: compact phones (<360px), tablets (content cap 680, tab bar max 520), keyboard handling, font-scale caps (`src/hooks/useResponsive.ts`). iPad `requireFullScreen: true`.
- Prayer times live from Muslimoon (web falls back to samples — API has no CORS).
- Events + programs + campaigns read live (`src/api/muslimoon.ts`); AHC's lists are currently empty so labelled samples show. Defensive normalizers accept common field aliases — tighten once real samples exist (save to `docs/samples/`).
- Donations open AHC's IRM checkout `https://app.irm.io/abuhuraira.org/e/checkout` (`src/config/donations.ts`). No PII in URLs. Pre-fill params unknown — set `prefillParams` once IRM/IT confirm. Mock login toggle is `__DEV__` only.
- Local reminders (`src/notifications/`): salah at adhan or N min before iqamah, per prayer, Jumu'ah replaces Dhuhr on Fridays, class/event reminders 1h or 1 day before. Live data only; Toronto wall-clock → UTC (DST-safe); 7-day rolling window, ≤ 60 pending (iOS limit 64). Android `SCHEDULE_EXACT_ALARM` declared (needs Play Console declaration).
- Sharing: `SHARING.md` (web preview link, `npm run share` tunnel for Expo Go, `eas.json` preview/production builds).
- Brand: `BRANDING.md`; a "Abu Huraira Center App" design system was published for Sheikh Amaar's sign-off. Jewel/sky tones are additions pending approval; formal AHC brand book still pending.
- Firebase backend scaffolded (`functions/`, `firebase.json`, `firestore.rules`): push notifications for announcements (Firestore trigger → Expo push API, no expo-server-sdk dependency), device token registration (`registerPushToken` callable, client in `src/notifications/pushToken.ts` + `PushTokenSync.tsx`), YouTube latest videos (quota-cheap `playlistItems.list`, 10-min cache) and a live-video detector (scheduled every 15 min — `search.list` is the only live-detection path and costs 100 of the 10,000 daily quota units per call, see `functions/src/lib/youtube.ts`), and a Muslimoon `/forms` proxy (`POST /api/public/{orgId}/forms/{formId}`, public, no auth — confirmed by Amaar 2026-10-02). None of it is deployed — no real Firebase project, EAS project id, or YouTube API key/channel id yet; `/forms` also has no real `formId` wired to any program/event yet. Firestore rules deny all client access by design (everything goes through a callable); loosen only once there's an admin console with its own auth.

## Muslimoon endpoints (see docs/muslimoon-api.md)
prayer-times ✅ (not final — AHC hasn't migrated off their old CMS yet) · events ✅ (empty) · programs ✅ (empty) · articles ✅ (empty) · campaigns ✅ (empty) · services ✅ (categories only, duplicated) · forms ✅ public, no auth (`POST /api/public/{orgId}/forms/{formId}`, formId TBD per form) · announcement-bar ✅ (seen on sandbox; Amaar activating for AHC) · settings 500 · announcements 404 (use announcement-bar instead).
Events/programs/campaigns are empty on purpose: AHC is holding off populating the CMS until IRM payment-status tracking is sorted (IRM has no webhook/2-way comms, so there's no way to know if a registration/donation was actually paid). Fajr iqamah-before-athan was **not a data bug** — just pre-migration data (Amaar, 2026-10-02).

## Still to build (Nov 30 scope)
1. **Firebase backend** — code scaffolded (see "Done so far" + `docs/firebase-backend.md`); still needs a real Firebase project, EAS project id, and YouTube API key/channel id before it can deploy. Secrets live only in Firebase, never in `EXPO_PUBLIC_*`.
2. Sign-in (donor login) + in-app account deletion (Apple requirement).
3. POST registrations via Muslimoon `forms` — endpoint confirmed working, public, no auth. Blocked on: a real program/event that has registration enabled, and its `formId` (not discoverable from the API, has to come from whoever creates the form in the CMS). Build demo programs/events from the live site (abuhuraira.org) once reachable, to firm up `src/api/muslimoon.ts`'s normalizer types before AHC's real data lands — don't want the app to crash on the real shape.
4. Announcements — use Muslimoon's `announcement-bar` endpoint (confirmed working on sandbox, Amaar activating for AHC) instead of the originally-planned Firestore-based system. Once confirmed live for AHC, change `onAnnouncementCreated` in `functions/src/index.ts` to a scheduled poller (same pattern as `checkYoutubeLive`) instead of a hand-written Firestore doc.
5. Multi-language: Arabic, Somali, Urdu (i18n + RTL for Arabic/Urdu). Omar can supply Arabic/Somali.
6. ~~Tax receipts via IRM~~ — out of scope; AHC's IRM/masjid-admin dashboard handles this on its own (Amaar, 2026-10-02).
7. Offline mode (cache last prayer times/events on device).
8. Social media links (More tab) — waiting on handles; Amaar says it's on the live website.
9. "Quran app demo" — scope still unclear; asked Sheikh Amaar, no answer yet.

## Open questions for AHC / IT
- IRM: exact query param *names* for donor name/email/amount/campaign/frequency (`d`/`w`/`m`) —
  Amaar confirmed IRM accepts these as pass-through values (2026-10-02), param names still TBD.
  Also decide whether to actually send name/email via URL at all — conflicts with this app's
  existing no-PII-in-URL policy (`src/config/donations.ts`); may be better to only pass
  amount/campaign/frequency and let the donor fill in name/email on IRM's own page.
- Muslimoon: form id(s) once AHC creates real registration forms in the CMS (endpoint itself is
  confirmed, see above). YouTube channel handle/ID — Amaar says it's in the CMS under Settings →
  Static Details, need him to just send the value (no dashboard access on our side).
- Verified address/phone for the More tab; social handles — Amaar says these are on the live
  website (abuhuraira.org); pull them once that's reachable, or ask him to paste them directly.
- Quran demo scope — still unanswered.
- Expo account: create an organization for AHC and link the project there (`npx eas-cli@latest init`).
