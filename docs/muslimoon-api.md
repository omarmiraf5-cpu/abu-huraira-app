# Muslimoon Masajid API: AHC findings

Last probed **2026-10-02, about 4:46 PM CST** with unauthenticated `curl` (GET/OPTIONS/HEAD only, plus one accidental empty POST, see below).
Base `https://masajid.muslimoon.app`, org id `e8a7eda8-3c55-4a9c-9b8f-9c9d37687534` (Abu Huraira Center, slug `Abu_Huraira_Center`).
Tip: the `x-matched-path` response header shows whether a Next.js route exists, even when it returns 404.

Raw responses are in `docs/samples/*.json`.

## Endpoint status

### `/v1/<org>/…`

| Path | Status | Notes / app use |
| --- | --- | --- |
| `prayer-times` | 200 | Live. **Not final**, see "Prayer times" below. `usePrayerTimes` |
| `events` | 200 | `events: []`. `fetchEventsResult` |
| `programs` | 200 | `programs: []`. Merged with events |
| `articles` | 200 | `articles: []`. `fetchArticles` (not in the UI) |
| `campaigns` | 200 | `{ campaigns: [], categories: [] }`. Donate causes |
| `services` | 200 | `services: []` plus 8 categories, each listed twice (the app de-dupes them) |
| `announcement-bar` | **200, 1 item** | Test item "This is a test announcment". `fetchAnnouncementsResult` |
| `org-settings` | **200** | Site settings (see below). `fetchStaticDetails` (YouTube/contact). Contact and socials are empty today |
| `billboards` | 200 | Empty, plus `display_settings` |
| `staff`, `faqs`, `instructors` | 200 | Empty |
| `donations` | 200 | "coming soon" placeholder |
| `settings` | **500** | Server error |
| `forms`, `forms/<id>`, `pledges` | 401 | Exist but need auth |
| `contact` | 405 on GET | POST-only |
| `calendar` | 404 (JSON) | |
| `announcements`, `static-details`, `static`, `details`, `youtube`, `registrations`, … | 404 (HTML) | Routes don't exist |

### `/api/public/<org>/…`

| Path | Status | Notes |
| --- | --- | --- |
| `forms/<form_id>` | **404 JSON `{"error":"Form not found"}`** | The route exists (`x-matched-path: /api/public/[org_id]/forms/[form_id]`; OPTIONS 204 allows GET, POST, PUT, DELETE, OPTIONS). The sandbox form id Amaar sent (`7a9da4d3-D219-…`, tried as given and in lowercase, and with the literal `{orgId}`) is not found under AHC's org, so it probably belongs to a sandbox org |
| `forms` (list), `events`, `programs`, `announcements`, `settings`, `static-details`, `prayer-times`, `contact`, `submit`, … | 404 (HTML) | Don't exist |

### CORS (why the web build shows previews)

Browsers can't read **any** of these endpoints:

- Most routes send no `Access-Control-Allow-Origin` at all.
- `org-settings` and `/api/public/*` send `Access-Control-Allow-Origin: *` **only when the request has no `Origin` header** (curl). When a browser sends `Origin`, the header is left out, so Chrome blocks the response (confirmed in the web build console).

Native iOS/Android aren't affected. For a live web build, Muslimoon would need to send CORS headers for browser origins, or we'd need a small proxy.

### Writes

No intentional writes were made. **One accidental `POST /v1/<org>/contact` with an empty JSON body `{}`** was sent on 2026-10-02 while checking which methods the route allows. The response was discarded and the request wasn't repeated. If Muslimoon logs contact submissions, there may be one empty entry.

## Shapes seen

### `announcement-bar`

```jsonc
{ "success": true, "organization": { "id", "name", "slug" },
  "items": [{ "id", "org_id", "message": "This is a test announcment",
    "link_text": null, "link_type": null, "link_url": null, "campaign_id": null,
    "display_order": 0, "is_active": true,
    "created_at": "2026-10-02T04:40:21.900532+00:00", "updated_at": "…" }] }
```

The app shows `is_active` items sorted by `display_order`. `link_url` + `link_text` become a button. `campaign_id` is parsed but not used yet. Optional `title`/`category` are accepted if they ever appear.

### `org-settings`

`display_name`, `timezone` ("America/Toronto"), `currency` ("cad"), `logo_url`, `primary_color`, `theme.resolved_css_vars` (the website's palette and fonts), `pledge_payment_methods` (e-Transfer to info@abuhuraira.org, Cash, Cheque, Money Order), `navbar`, `footer { short_text, social_links: [], quick_links, registered_charity_number: "", contact_info { address: "", phone: "", email: "" } }`, `seo { canonical_host: "abu_huraira_center.muslimoon.app", … }`, `donation_settings`, `subscription_settings`.

- **YouTube:** there's no YouTube field and `footer.social_links` is empty. `fetchStaticDetails` searches the payload for any YouTube URL or `@handle` (social_links, `youtube*` keys). Until one exists, the app uses the brand fallback in `src/theme/tokens.ts` (`@AbuHurairaCenter`, channel `UCP9ej92hIt-X16--0_MMwPA`, taken from abuhuraira.org).
- **Contact:** `contact_info` is empty, so More shows the website's details (270 Yorkland Blvd, North York ON M2J 5C9 · 416-752-1200 · info@abuhuraira.org). CMS values replace them automatically (`useStaticDetails`).

### `prayer-times`

```jsonc
{ "success": true, "organization": {…},
  "prayer_times": { "fajr": { "athan": "6:00 AM", "iqamah": "5:15 AM" }, …,
    "maghrib": { "athan": "Sunset", "iqamah": "+5 mins" }, "jummah1": {…}, … },
  "next_friday": { "date": "2026-10-02", … },
  "last_updated": "2026-10-01T00:00:00.201295",   // no offset = masjid wall-clock
  "timezone": "America/Toronto" }
```

## Prayer times are not final

Amaar confirmed AHC hasn't finished moving its times to Muslimoon. The current data is clearly unfinished: **Fajr iqamah (5:15 AM) is before Fajr athan (6:00 AM)**.

For comparison, abuhuraira.org still reads the old CMS (`/api/prayers-cached`): Fajr 6:15 / 6:30, Dhuhr 1:30 / 1:45, Asr 4:45 / 5:00, Maghrib sunset +10, Isha 8:30 / 8:45, Jumu'ah 1:30 and 2:30.

The app shows Muslimoon's values as-is (comments in `fetchPrayerTimes` and `usePrayerTimes`). Reminders follow whatever Muslimoon returns, so they'll correct themselves once AHC finishes the migration.

## Dates and times: tolerant parsing

Item shapes for events/programs/forms aren't documented and the lists are empty, so everything goes through never-throw helpers in `src/api/parse.ts` (tested in `tests/parse.test.ts`, `npm test`):

- Formats seen: ISO with offset and microseconds (`2026-10-02T04:40:21.900532+00:00`), ISO without offset (`2026-10-01T00:00:00.201295`), ISO `Z` (old CMS), date-only, and 12-hour strings (`"6:00 AM"`, `"Sunset"`, `"+5 mins"`). The website's programs also use free text like `"7.45pm 8.45 pm"` and `"After Fajr"`.
- `parseDateLoose`: ISO with or without offset (no offset = Toronto wall-clock), microseconds (Hermes-safe), space separator, `MM/DD/YYYY`, "October 3, 2026", and epoch seconds/ms. Unknown values return `null` rather than throwing.
- `parseTimeRange`: "7:45 PM – 8:45 PM", "7.45pm 8.45 pm", "18:00-20:00", "After Fajr" (kept as a label).
- `normalizeEvent` accepts snake_case, camelCase and the old CMS names (`name`/`title`, `start_date`/`startDate`/`date`, `pattern`/`schedule`/`recurrence`, `price`/`fee`/`cost`, `registrationRequired`, `externalRegistrationLink`, `form_id`, `curriculumItems`, `isArchived`/`isPublic`/`is_active`, …). Unknown fields are ignored and missing ones are omitted. Archived/hidden items are dropped.

## Demo data (until AHC publishes)

`src/data/demo/` holds Muslimoon-style data built from abuhuraira.org (2026-10-02). It deliberately mixes formats so the parser is exercised.

- `programs.json`: 10 current programs (Attabukiyyah, Sunday Halaqah, The Complete Muslimah, Tafseer Surah Yusuf, Footsteps of the Chosen, Iqra Evening School, Girls Weekend Hifdh, AHC Weekend School, Full Time Hifdh, Perfecting Your Salah) with real fees, audiences and registration links.
- `announcements.json`: the website's 3 community announcements (Iqra, Girls Hifdh, Weekend School) in the `announcement-bar` shape.
- `form-iqra.json`: a guessed form schema (`demo-iqra-registration`) used to preview the forms renderer.

Rules: demo data appears only while both `events` and `programs` are empty (or unreachable). It's labelled "Preview" everywhere and **never scheduled as reminders** (`source: 'sample'`). Single-day timed programs generate the next dated sessions for "This week at AHC".

## Forms

- Client: `fetchFormSchema(formId)` does a GET to `/api/public/<org>/forms/<id>` and returns `ok` / `not-found` / `error`. `normalizeFormSchema` accepts `fields` / `questions` / `sections[].fields` / JSON-schema `properties`. The field types are text, textarea, email, phone, number, date, select/radio (chips), multiselect, checkbox and info. Unknown types fall back to text.
- UI: `src/components/forms/FormRenderer.tsx` (validation, required markers), shown on the program detail screen (`app/event/[id].tsx`).
- **Submission is off:** `FORM_SUBMISSION_ENABLED = false`, and `submitForm` is a stub that makes no network call. The button reads "In-app registration coming soon", and donors are pointed to the external registration link. **TODO** once Muslimoon documents it: the submit route, method, payload, response, any captcha/rate limit, and how a program/event links to its form (`form_id`?). Note: the server-side proxy in `functions/src/lib/muslimoonProxy.ts` already targets this same `/api/public/<org>/forms/<id>` path for a future `POST` submit, once the submit contract is confirmed.

## Donations / IRM

Config: `src/config/donations.ts`. IRM issues tax receipts, so the app has no receipt UI or copy.

- Donate collects cause, amount, **frequency** (One-time / Daily / Weekly / Monthly), name and email, and passes them to `buildCheckoutUrl()`.
- **Everything is a placeholder until Amaar sends a sample checkout link.** `checkoutUrl` = `https://app.irm.io/abuhuraira.org/e/checkout`. Every `prefillParams.*` is `null`, so **nothing is appended** and the donor confirms on IRM's page. `frequencyCodes` = d / w / m ("probably", per Amaar). `irmCampaigns` maps general → `masjid-operation`, zakat → `zakat-al-maal`, sadaqah → `sadaqah`, Dollar a Day → unknown, plus `automate-your-jummah`.
- Privacy: name/email in a URL end up in history and logs. Leave those two params `null` unless IT approves.
- Research (IRM's public page JavaScript, unconfirmed, **not enabled**): campaign pages are `app.irm.io/abuhuraira.org/<campaign>`. Routes include `:realm/:campaign/:amount/:frequency[/:duration]`, `:realm/e/checkout` and `:realm/cart`. Query params read: `a` (amount), `f` (frequency), `d` (duration), `n`/`note`, `r`/`return_url`. Frequency appears to be matched case-insensitively against the campaign's own option labels (e.g. "Monthly"), **not** d/w/m. No name/email prefill params were found.

## Website oddities spotted (abuhuraira.org, 2026-10-02)

- Sunday Halaqah says "starting **October 3, 2026**", which is a Saturday. The demo uses Sunday Oct 4.
- The Events page shows "No events found", and the old CMS events feed is `[]`.
- Website prayer times differ from Muslimoon (see above).
- The basketball camp is listed but registration is closed.

## Open questions for Amaar / Muslimoon

1. IRM: the exact checkout URL and param names; whether frequency is labels ("Monthly") or d/w/m; how one-time gifts are handled; whether name/email can be prefilled; the campaign id for each cause (including Dollar a Day).
2. Forms: the public submit route, payload and response, captcha; the sandbox org id for form `7a9da4d3-…`; how programs reference forms.
3. Settings: where YouTube/socials should live (`org-settings.footer.social_links`?); why `/v1/<org>/settings` returns 500; filling in `contact_info`.
4. CORS for browser origins (web build).
5. Event/program JSON field names, date/time formats, timezone (offset or wall-clock), and whether multi-day schedules ("Mon & Wed") are supported.
6. Is `announcement-bar` the intended announcements feed, and will the test item be removed?
7. When the prayer-time migration will be finished (Fajr iqamah is currently before athan).
