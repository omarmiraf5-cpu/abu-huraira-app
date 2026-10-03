/**
 * Donation checkout configuration — IRM (irm.io).
 *
 * Receipts: IRM issues tax receipts. The app collects nothing for receipts and
 * shows no receipt UI (Amaar, Muslimoon, 2026-10-02).
 *
 * Checkout URL format — CONFIRMED working on-device, 2026-10-03:
 *   https://app.irm.io/<realm>/<campaign-slug>/<amount>/<frequency>
 * e.g. https://app.irm.io/abuhuraira.org/masjid-operation/50/once
 *
 * The bare realm root (no slug/amount/frequency) still works and lets the
 * donor pick a campaign and amount on IRM's own page — used as the fallback
 * for causes with no known IRM slug yet (e.g. "Dollar a Day"). The old
 * `.../e/checkout` link AHC originally gave (2026-10-01) does NOT work on its
 * own — it renders a blank page with nothing to check out, since it has no
 * campaign/amount attached.
 *
 * Still unconfirmed: whether IRM accepts donor name/email as query params
 * (Amaar said conceptually yes, exact param names unknown) — `prefillParams`
 * stays empty until that's nailed down.
 *
 * Privacy: name/email in a URL end up in browser history and server logs —
 * leave `prefillParams.name`/`email` null unless IT approves sending them.
 */

export type DonationFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export const FREQUENCIES: { key: DonationFrequency; label: string; short: string; per: string }[] = [
  { key: 'once', label: 'One-time', short: 'Once', per: '' },
  { key: 'daily', label: 'Daily', short: 'Daily', per: '/ day' },
  { key: 'weekly', label: 'Weekly', short: 'Weekly', per: '/ week' },
  { key: 'monthly', label: 'Monthly', short: 'Monthly', per: '/ month' },
];

type PrefillKey = 'name' | 'email';

export const donationsConfig = {
  provider: 'IRM',
  /** IRM "realm" root for AHC — confirmed working 2026-10-03. */
  realmUrl: 'https://app.irm.io/abuhuraira.org',
  /** Display host shown to donors before they leave the app. */
  displayHost: 'app.irm.io',
  currency: 'CAD',
  locale: 'en-CA',
  /**
   * PLACEHOLDER query-parameter names IRM accepts for pre-filling donor
   * details. null = not confirmed → not sent.
   */
  prefillParams: {
    name: null,
    email: null,
  } as Record<PrefillKey, string | null>,
  /**
   * App cause id → IRM campaign slug (path segment, confirmed format).
   * null = no known slug yet — falls back to the realm root.
   */
  irmCampaigns: {
    general: 'masjid-operation',
    zakat: 'zakat-al-maal',
    sadaqah: 'sadaqah',
    'dollar-a-day': null,
    'automate-your-jummah': 'automate-your-jummah',
  } as Record<string, string | null>,
} as const;

export type CheckoutParams = {
  amount: number;
  frequency?: DonationFrequency;
  /** App cause id (mapped through irmCampaigns) */
  campaignId?: string;
  name?: string;
  email?: string;
};

/** True once at least one pre-fill parameter is configured. */
export const CHECKOUT_PREFILLS = Object.values(donationsConfig.prefillParams).some(Boolean);

/**
 * Build the IRM checkout URL: realm/<campaign-slug>/<amount>/<frequency>
 * when the cause has a known IRM slug and a positive amount, otherwise the
 * realm root (donor picks a campaign and amount on IRM's page). Donor
 * name/email are appended as query params only once their param names are
 * confirmed.
 */
export function buildCheckoutUrl(params: CheckoutParams): string {
  const freq = params.frequency ?? 'once';
  const slug = params.campaignId ? donationsConfig.irmCampaigns[params.campaignId] : undefined;
  const base =
    slug && params.amount > 0
      ? `${donationsConfig.realmUrl}/${slug}/${params.amount}/${freq}`
      : donationsConfig.realmUrl;
  const url = new URL(base);
  const nameParam = donationsConfig.prefillParams.name;
  const emailParam = donationsConfig.prefillParams.email;
  if (nameParam && params.name?.trim()) url.searchParams.set(nameParam, params.name.trim());
  if (emailParam && params.email?.trim()) url.searchParams.set(emailParam, params.email.trim());
  return url.toString();
}

export const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500] as const;
