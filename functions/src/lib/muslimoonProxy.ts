/**
 * Proxy for Muslimoon's /forms endpoint.
 *
 * Confirmed by Sheikh Amaar (Muslimoon's founder, 2026-10-02): this is a
 * public route — no auth, since Muslimoon doesn't have a user-login/auth
 * flow yet. Real path, e.g.:
 *   https://masajid.muslimoon.app/api/public/{orgId}/forms/{formId}
 *
 * Each form has its own id, generated when it's created in the Muslimoon
 * CMS — there's no way to discover it from a program/event's own JSON, so
 * whoever creates a form in the CMS has to hand over its id separately
 * (see CLAUDE.md "Open questions").
 *
 * This still runs through our own Cloud Function (not called directly from
 * the client) so the org id and base URL stay server-side and consistent
 * with the rest of the Muslimoon integration, even though no secret is
 * needed for the request itself.
 */
const BASE_URL = 'https://masajid.muslimoon.app';
const ORG_ID = 'e8a7eda8-3c55-4a9c-9b8f-9c9d37687534';

export async function postMuslimoonForm(
  formId: string,
  payload: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE_URL}/api/public/${ORG_ID}/forms/${formId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}
