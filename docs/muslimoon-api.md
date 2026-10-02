# Muslimoon Masajid API — AHC findings

Probed 2026-09-30 ~10:30 PM CST (2026-10-01 04:30 UTC) with plain, unauthenticated `curl` GETs.
Org id: `e8a7eda8-3c55-4a9c-9b8f-9c9d37687534` (Abu Huraira Center, slug `Abu_Huraira_Center`).

## Endpoint status

| URL pattern | prayer-times | events | programs | announcements | articles |
| --- | --- | --- | --- | --- | --- |
| `https://masajid.muslimoon.app/v1/<org>/…` | **200 JSON** | **200 JSON** | **200 JSON** | 404 (HTML) | **200 JSON** |

### Re-probe 2026-10-01 (afternoon MT)

| Path | Status | Notes |
| --- | --- | --- |
| `prayer-times` | 200 | unchanged; Fajr iqamah (5:15 AM) still earlier than athan (6:00 AM) |
| `events` | 200 | still `[]` |
| `programs` | 200 | still `[]` |
| `articles` | 200 | still `[]` |
| `campaigns` | **200** | **new find** — `{ campaigns: [], categories: [] }` (sample: `docs/samples/campaigns.json`) |
| `services` | **200** | `services: []`, `instructors: []`, 8 categories — each name appears twice (server-side duplicates; app de-dupes by name) |
| `forms` | public | confirmed by Amaar (2026-10-02): `POST /api/public/<org>/forms/<formId>`, no auth (Muslimoon has no user-login flow yet). `formId` is per-form, handed over separately when a form is created in the CMS — not discoverable from program/event JSON. |
| `settings` | 500 | server error |
| `info`, `khutbahs`, `/v1/<org>` | 404 | |

### What the app reads now

- **Prayer times** — live (unchanged).
- **Events tab / Home "Upcoming"** — `events` + `programs` fetched in parallel and merged. Real items replace the samples automatically; the "Preview" labels only show while both lists are empty.
- **Donate causes** — `campaigns`. Live campaigns replace the four default causes automatically. The default causes no longer show invented goal/raised figures.
- **Services / articles** — client functions (`fetchServices`, `fetchArticles`) ready; not in the UI yet.
- Item shapes are unknown until AHC publishes data, so the normalisers accept common field aliases (`title`/`name`, `start_date`/`date`/`starts_at`, `goal`/`goal_amount`/`target_amount`, `raised`/`amount_raised`, …). Save a real sample here once data exists and tighten the types.
- **Why everything's still empty (Amaar, 2026-10-02):** before populating the real CMS, AHC needs
  to sort out payment tracking with IRM — their checkout doesn't support 2-way communication, so
  there's no way to know whether a registration/donation was actually paid. Blocks real data, not
  the API itself. Action item: once real programs/events exist on the live site (abuhuraira.org),
  pull a sample to firm up the normalizer types before AHC switches the CMS over, so the app
  doesn't crash on the real shape. (Not done yet — this sandbox's network policy currently blocks
  reaching both abuhuraira.org and masajid.muslimoon.app directly.)
- **`announcement-bar`** (separate from the 404'ing `announcements` above) is a real, working
  endpoint — seen live on Muslimoon's sandbox org, returning `{ success, organization, items: [{
  message, link_text, link_type, link_url, campaign_id, display_order, is_active }] }`. Amaar is
  activating it for AHC's org now; once confirmed working there, this can replace the
  Firestore-based announcements plan in CLAUDE.md item 4 — a scheduled poll (same pattern as
  `checkYoutubeLive`) instead of a hand-written Firestore doc.
| `https://masjid.muslimoon.app/v1/<org>/…` | 404 `{"error":"Unknown org"}` | 404 same | 404 same | 404 same | 404 same |
| `https://masajid.muslimoon.app/api/v1/<org>/…` | 404 (HTML) | 404 | 404 | 404 | 404 |

No endpoint required auth. Responses are served from Vercel (`cache-control: public`).
**No CORS headers** (`Access-Control-Allow-Origin` absent), so browser/web builds can't read the API —
the app falls back to mock data on web. Native iOS/Android are unaffected. A small proxy (or asking
Muslimoon to add CORS) would be needed for a live web build.

Samples: `docs/samples/{prayer-times,events,programs,articles}.json`.

## `GET /v1/<org>/prayer-times`

```jsonc
{
  "success": true,
  "organization": { "id": "…", "name": "Abu Huraira Center", "slug": "Abu_Huraira_Center" },
  "prayer_times": {
    "fajr":    { "athan": "6:00 AM", "iqamah": "5:15 AM" },
    "dhuhr":   { "athan": "1:30 PM", "iqamah": "1:45 PM" },
    "asr":     { "athan": "5:00 PM", "iqamah": "5:15 PM" },
    "maghrib": { "athan": "Sunset",  "iqamah": "+5 mins" },
    "isha":    { "athan": "8:00 PM", "iqamah": "8:15 PM" },
    "jummah1": { "athan": "1:30 PM", "iqamah": "2:00 PM", "khateeb": null },
    "jummah2": null, "jummah3": null,
    "taraweeh": null, "tahajjud": null,
    "eid1": null, "eid2": null, "eid3": null, "eid4": null, "eid5": null,
    "kusuf": null, "khusuf": null,
    "janazah": { "available": false, "date": null, "time": "1:00 PM", "salah_location": null, "cemetery_address": null }
  },
  "prayer_calendar_url": null,
  "prayer_calendar_button_name": null,
  "prayer_calendar_updated_at": null,
  "friday_khutbahs": [],
  "next_friday": { "date": "2026-10-02", "khutbahs_scheduled": 0 },
  "khutbah_count": 2,
  "last_updated": "2026-10-01T00:00:00.201295",   // no UTC offset
  "timezone": "America/Toronto"
}
```

Notes:
- Times are local wall-clock strings (12h with AM/PM) — no dates; the payload is "today".
- Key is `athan` (not `adhan`). Non-clock values occur: `"Sunset"` and relative `"+5 mins"`.
  The app estimates sunset for the AHC location to place Maghrib and compute the next prayer.
- Data oddity at time of capture: Fajr iqamah (5:15 AM) is *earlier* than Fajr athan (6:00 AM).
  **Update (Amaar, 2026-10-02): not a data bug** — AHC hasn't finished migrating off their old
  CMS, so these aren't the real production prayer times yet. Re-check once the migration's done
  rather than treating this as something to fix.
- `?date=` query param is accepted (200) but no evidence it changes the result.

## `GET /v1/<org>/events`
`{ success, organization: { id, display_name, org_slug }, events: [] }` — empty, item shape unknown.

## `GET /v1/<org>/programs`
`{ programs: [], organization: { id, display_name, org_slug } }` — empty, item shape unknown.

## `GET /v1/<org>/articles`
`{ success, organization: { id, name, slug }, articles: [], count: 0 }` — empty, item shape unknown.

## `GET /v1/<org>/announcements`
404 (Next.js HTML not-found page) — route does not exist.

The Events tab still uses mocks; wire it once AHC publishes events so the item shape can be typed.
