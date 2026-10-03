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
- Events + programs + campaigns read live (`src/api/muslimoon.ts`); AHC's lists are currently empty so the app shows real website-based demo data instead (`src/data/demo/`, 10 actual current AHC programs). Tolerant parsing (`src/api/parse.ts`, tested in `tests/parse.test.ts`) means real CMS data of almost any shape won't crash the app — tighten the types once a real sample exists (save to `docs/samples/`).
- Event/program detail screen (`app/event/[id].tsx`): schedule, fee, audience, curriculum, registration. Registration shows an external link when the CMS provides one, or renders a Muslimoon public form (`fetchFormSchema` + `src/components/forms/FormRenderer.tsx`) when it has a `formId` — in-app **submission is off** (`FORM_SUBMISSION_ENABLED = false` in `muslimoon.ts`) until Muslimoon documents the submit route/payload.
- Announcements: Muslimoon's `announcement-bar` endpoint (confirmed live for AHC's org, Amaar activated it 2026-10-02) shown on Home; falls back to 3 real website announcements when empty.
- Static details (`src/hooks/useStaticDetails.ts`, reads `org-settings`): contact info and YouTube link for the More tab. Muslimoon's CMS fields are empty today, so these fall back to real values captured from abuhuraira.org (address, phone, YouTube `@AbuHurairaCenter` / `UCP9ej92hIt-X16--0_MMwPA`) — CMS values will override once Amaar fills them in.
- Donations open AHC's IRM checkout (`src/config/donations.ts`), with a frequency picker (one-time/daily/weekly/monthly). **Confirmed working checkout URL format (2026-10-03, tested on device):** `https://app.irm.io/<realm>/<campaign-slug>/<amount>/<frequency>` (e.g. `.../abuhuraira.org/masjid-operation/50/once`) — the originally-given bare `.../e/checkout` link does **not** work on its own (blank page, no campaign/amount attached). Causes without a known IRM slug (Dollar a Day) fall back to the realm root so the donor picks on IRM's page. Donor name/email query-param names are still unconfirmed placeholders — not sent. No PII in URLs by default. Mock login toggle is `__DEV__` only.
- Local reminders (`src/notifications/`): salah at adhan or N min before iqamah, per prayer, Jumu'ah replaces Dhuhr on Fridays, class/event reminders 1h or 1 day before. Live data only; Toronto wall-clock → UTC (DST-safe); 7-day rolling window, ≤ 60 pending (iOS limit 64). Android `SCHEDULE_EXACT_ALARM` declared (needs Play Console declaration).
- Sharing: `SHARING.md` (web preview link, `npm run share` tunnel for Expo Go, `eas.json` preview/production builds).
- Brand: `BRANDING.md`; a "Abu Huraira Center App" design system was published for Sheikh Amaar's sign-off. Jewel/sky tones are additions pending approval; formal AHC brand book still pending.
- Firebase backend scaffolded (`functions/`, `firebase.json`, `firestore.rules`): push notifications for announcements (Firestore trigger → Expo push API, no expo-server-sdk dependency), device token registration (`registerPushToken` callable, client in `src/notifications/pushToken.ts` + `PushTokenSync.tsx`), YouTube latest videos (quota-cheap `playlistItems.list`, 10-min cache) and a live-video detector (scheduled every 15 min — `search.list` is the only live-detection path and costs 100 of the 10,000 daily quota units per call, see `functions/src/lib/youtube.ts`), and a Muslimoon `/forms` proxy (`POST /api/public/{orgId}/forms/{formId}`, public, no auth — confirmed by Amaar 2026-10-02). None of it is deployed — no real Firebase project, EAS project id, or YouTube API key/channel id yet; `/forms` also has no real `formId` wired to any program/event yet. Firestore rules deny all client access by design (everything goes through a callable); loosen only once there's an admin console with its own auth.

## Muslimoon endpoints (see docs/muslimoon-api.md)
prayer-times ✅ (not final — AHC hasn't migrated off their old CMS yet) · events ✅ (empty) · programs ✅ (empty) · articles ✅ (empty) · campaigns ✅ (empty) · services ✅ (categories only, duplicated) · announcement-bar ✅ live for AHC, 1 test item · org-settings ✅ (contact/socials empty today) · billboards/staff/faqs/instructors/donations ✅ (all empty) · `forms`/`forms/<id>`/`pledges` (the `/v1/<org>/` ones) 401, needs auth · `GET/POST /api/public/<org>/forms/<formId>` ✅ public, no auth, confirmed route (404 JSON for an unknown id) · settings 500 · announcements 404 (use announcement-bar instead).
Events/programs/campaigns are empty on purpose: AHC is holding off populating the CMS until IRM payment-status tracking is sorted (IRM has no webhook/2-way comms, so there's no way to know if a registration/donation was actually paid). Fajr iqamah-before-athan was **not a data bug** — just pre-migration data (Amaar, 2026-10-02). Full findings, shapes, and the IRM/forms research notes: `docs/muslimoon-api.md`.

## Still to build (Nov 30 scope)
1. **Firebase backend** — code scaffolded (see "Done so far" + `docs/firebase-backend.md`); still needs a real Firebase project, EAS project id, and YouTube API key/channel id before it can deploy. Secrets live only in Firebase, never in `EXPO_PUBLIC_*`.
2. Sign-in (donor login) + in-app account deletion (Apple requirement).
3. POST registrations via Muslimoon `forms` — endpoint confirmed working, public, no auth, and the client/UI side is built (`fetchFormSchema`, `FormRenderer`, demo form preview on the event detail screen). Blocked on: Muslimoon documenting the actual submit contract (route, payload, response, captcha/rate-limit) — `FORM_SUBMISSION_ENABLED = false` until then — and a real `formId` once AHC creates a form in the CMS and links it to a program/event (not discoverable from the API).
4. Announcements — now shown on Home from Muslimoon's `announcement-bar` (confirmed live for AHC, see above). Still to do: change `onAnnouncementCreated` in `functions/src/index.ts` from a hand-written Firestore doc to a scheduled poller of `announcement-bar` (same pattern as `checkYoutubeLive`), so push notifications fire for real Muslimoon announcements instead of needing a manual Firestore write.
5. Multi-language: Arabic, Somali, Urdu (i18n + RTL for Arabic/Urdu). Omar can supply Arabic/Somali.
6. ~~Tax receipts via IRM~~ — out of scope; AHC's IRM/masjid-admin dashboard handles this on its own (Amaar, 2026-10-02).
7. Offline mode (cache last prayer times/events on device).
8. Social media links (More tab) — Instagram/Facebook/YouTube now shown, from real abuhuraira.org handles (`brand.socials`/`brand.youtube` in `src/theme/tokens.ts`); will switch to Muslimoon's own values once Amaar fills in `org-settings.footer.social_links`.
9. "Quran app demo" — scope still unclear; asked Sheikh Amaar, no answer yet.

## Open questions for AHC / IT
- IRM: the realm/campaign-slug/amount/frequency checkout path is confirmed working (see above) —
  still need the real campaign slugs for every cause (only general/zakat/sadaqah/automate-your-jummah
  are guessed from abuhuraira.org; confirm these are the actual IRM slugs, and get one for
  "Dollar a Day"). Also still unconfirmed: the query-param names for donor name/email (decide
  whether to send them at all — conflicts with this app's no-PII-in-URL policy; may be better to
  let the donor fill those in on IRM's own page) and how recurring gifts actually get tracked
  (does the `/frequency` path segment alone set up a recurring charge, or does IRM need something
  else?).
- Muslimoon: form id(s) once AHC creates real registration forms in the CMS, and how a
  program/event is supposed to reference its form (`form_id` field?) — the submit endpoint and
  payload shape itself are still undocumented (GET works, POST contract unconfirmed).
- YouTube channel handle/ID — using the real `@AbuHurairaCenter` / `UCP9ej92hIt-X16--0_MMwPA` as a
  fallback (verified from abuhuraira.org); confirm this is current, or get the value AHC wants set
  in Muslimoon's CMS (Settings → Static Details) so `org-settings` starts returning it.
- Verified address/phone/socials for the More tab — using real abuhuraira.org values as a
  fallback (270 Yorkland Blvd, North York ON M2J 5C9 · 416-752-1200 · Instagram/Facebook handles);
  confirm these are current and get them into Muslimoon's `org-settings` so the CMS is the source
  of truth going forward.
- Quran demo scope — still unanswered.
- Expo account: create an organization for AHC and link the project there (`npx eas-cli@latest init`).
