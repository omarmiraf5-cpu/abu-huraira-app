/**
 * Proxy for Muslimoon endpoints that need authentication the client can't
 * hold (API key/token — see CLAUDE.md "Open questions"). The public,
 * unauthenticated endpoints (prayer-times, events, programs, campaigns,
 * articles) stay client-side (src/api/muslimoon.ts) — this is only for
 * `/forms`, which currently 401s without credentials nobody has yet.
 *
 * TODO once AHC/IT confirm how Muslimoon auth works: set the
 * MUSLIMOON_API_KEY secret (`firebase functions:secrets:set MUSLIMOON_API_KEY`)
 * and fill in the real auth header below — Muslimoon's docs haven't said
 * whether it's a bearer token, an API-key header, or something else.
 */
const BASE_URL = 'https://masajid.muslimoon.app';
const ORG_ID = 'e8a7eda8-3c55-4a9c-9b8f-9c9d37687534';

export async function postMuslimoonForm(
  formPath: string,
  payload: unknown,
  apiKey: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE_URL}/v1/${ORG_ID}/forms/${formPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Placeholder — confirm the real scheme with Muslimoon/AHC's IT contact.
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}
